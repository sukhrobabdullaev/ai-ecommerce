"""
Step 5: Unified evaluation harness — Precision@10, Recall@10, NDCG@10
for all four models (Random Forest, XGBoost, RAG, Zero-Shot Prompting).

Also outputs stratified results by:
  - User activity: cold (5-9), medium (10-29), active (30+)
  - Item popularity: niche (10-49), moderate (50-199), popular (200+)

Reads:
  data/test_candidates.parquet
  data/user_histories.json
  data/item_meta.parquet
  data/rf_model.pkl
  data/xgb_model.pkl
  data/faiss_index.bin
  data/chunk_metadata.json
  data/feature_names.json
  data/interactions_filtered.parquet

Writes:
  results/accuracy_table.csv
  results/accuracy_by_user_activity.csv
  results/accuracy_by_item_popularity.csv
"""

import json
import os
import pickle
import re
import time
import warnings
import faiss
import numpy as np
import pandas as pd
from pathlib import Path
from tqdm import tqdm
from openai import OpenAI
from dotenv import load_dotenv

warnings.filterwarnings("ignore")
load_dotenv()

DATA_DIR = Path(__file__).parent / "data"
RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

K = 10
EMBED_MODEL = "text-embedding-3-small"
LLM_MODEL = "gpt-3.5-turbo-0125"
RAG_TOP_CHUNKS = 5
PROMPTING_CANDIDATES = 20
MAX_RETRIES = 5


# ──────────────────────────────────────────────────────────────────────────────
# Metric helpers
# ──────────────────────────────────────────────────────────────────────────────

def precision_at_k(recommended: list, relevant: set, k: int) -> float:
    return len(set(recommended[:k]) & relevant) / k


def recall_at_k(recommended: list, relevant: set, k: int) -> float:
    if not relevant:
        return 0.0
    return len(set(recommended[:k]) & relevant) / len(relevant)


def ndcg_at_k(recommended: list, relevant: set, k: int) -> float:
    dcg = sum(
        (1.0 / np.log2(i + 2)) for i, item in enumerate(recommended[:k]) if item in relevant
    )
    n_rel = min(len(relevant), k)
    idcg = sum(1.0 / np.log2(i + 2) for i in range(n_rel))
    return dcg / idcg if idcg > 0 else 0.0


def compute_metrics(recs_dict: dict) -> dict:
    """recs_dict: {user_id: (recommended_list, relevant_set)}"""
    p, r, n = [], [], []
    for uid, (rec, rel) in recs_dict.items():
        p.append(precision_at_k(rec, rel, K))
        r.append(recall_at_k(rec, rel, K))
        n.append(ndcg_at_k(rec, rel, K))
    return {
        f"Precision@{K}": round(np.mean(p), 4),
        f"Recall@{K}": round(np.mean(r), 4),
        f"NDCG@{K}": round(np.mean(n), 4),
    }


# ──────────────────────────────────────────────────────────────────────────────
# ML evaluation
# ──────────────────────────────────────────────────────────────────────────────

def evaluate_ml(model, test_df: pd.DataFrame, feat_names: list) -> dict:
    feat_cols = [c for c in feat_names if c in test_df.columns]
    X = test_df[feat_cols].values.astype(np.float32)
    scores = model.predict_proba(X)[:, 1]
    test_df = test_df.copy()
    test_df["score"] = scores

    recs = {}
    for uid, grp in test_df.groupby("user_id"):
        ranked = grp.sort_values("score", ascending=False)["item_id"].tolist()
        relevant = set(grp[grp["label"] == 1]["item_id"].tolist())
        recs[uid] = (ranked, relevant)

    return compute_metrics(recs), recs


# ──────────────────────────────────────────────────────────────────────────────
# RAG evaluation
# ──────────────────────────────────────────────────────────────────────────────

def serialize_history(history: list, max_items: int = 20) -> str:
    """Convert user interaction history to natural language."""
    history = sorted(history, key=lambda x: x["timestamp"])[-max_items:]
    lines = []
    for h in history:
        title = h.get("title", h["item_id"])
        rating = h.get("rating", "?")
        lines.append(f"- {title} (rated {rating}/5)")
    return "\n".join(lines)


def embed_query(client: OpenAI, text: str) -> np.ndarray:
    for attempt in range(MAX_RETRIES):
        try:
            resp = client.embeddings.create(model=EMBED_MODEL, input=[text])
            return np.array(resp.data[0].embedding, dtype=np.float32).reshape(1, -1)
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)
            else:
                raise


def llm_call(client: OpenAI, prompt: str) -> str:
    for attempt in range(MAX_RETRIES):
        try:
            resp = client.chat.completions.create(
                model=LLM_MODEL,
                messages=[
                    {"role": "system", "content":
                     "You are a helpful e-commerce product recommendation assistant."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
                max_tokens=500,
            )
            return resp.choices[0].message.content.strip()
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)
            else:
                raise RuntimeError(
                    f"LLM API call failed after {MAX_RETRIES} retries: {e}"
                ) from e
    return ""  # unreachable, satisfies type checkers


def parse_ranked_titles(text: str) -> list[str]:
    """Extract numbered list of product titles from LLM output."""
    lines = text.strip().split("\n")
    titles = []
    for line in lines:
        line = line.strip()
        m = re.match(r"^\d+[\.\)]\s*(.+)$", line)
        if m:
            titles.append(m.group(1).strip())
    return titles


def titles_to_item_ids(titles: list[str], title_map: dict) -> list[str]:
    """Fuzzy-match LLM output titles to item IDs."""
    item_ids = []
    lower_map = {t.lower().strip(): iid for iid, t in title_map.items()}
    for title in titles:
        key = title.lower().strip()
        if key in lower_map:
            item_ids.append(lower_map[key])
        else:
            # Partial match: find best overlap
            best_iid, best_score = None, 0
            for cand_title, iid in lower_map.items():
                score = len(set(key.split()) & set(cand_title.split()))
                if score > best_score:
                    best_score = score
                    best_iid = iid
            if best_iid and best_score >= 2:
                item_ids.append(best_iid)
    return item_ids


def evaluate_rag(
    test_df: pd.DataFrame,
    user_histories: dict,
    faiss_index,
    chunk_metadata: list,
    title_map: dict,
    client: OpenAI,
) -> tuple[dict, dict]:
    recs = {}
    test_users = test_df["user_id"].unique().tolist()

    for uid in tqdm(test_users, desc="RAG eval"):
        history = user_histories.get(uid, [])
        if not history:
            continue

        query_text = "Purchase history:\n" + serialize_history(history)
        query_vec = embed_query(client, query_text)

        # Retrieve top-5 chunks
        distances, indices = faiss_index.search(query_vec, RAG_TOP_CHUNKS)
        retrieved_chunks = [
            chunk_metadata[idx]["text"]
            for idx in indices[0]
            if idx < len(chunk_metadata)
        ]

        context = "\n\n".join(
            [f"Review {i+1}: {chunk[:300]}" for i, chunk in enumerate(retrieved_chunks)]
        )
        history_text = serialize_history(history)

        prompt = (
            f"Purchase History:\n{history_text}\n\n"
            f"Relevant Customer Reviews:\n{context}\n\n"
            "Based on this purchase history and customer reviews, "
            "recommend exactly 10 electronics products the user would most likely purchase next. "
            "Return only product titles in a numbered list."
        )

        output = llm_call(client, prompt)
        titles = parse_ranked_titles(output)
        rec_ids = titles_to_item_ids(titles, title_map)

        relevant = set(
            test_df.loc[(test_df["user_id"] == uid) & (test_df["label"] == 1), "item_id"]
        )
        recs[uid] = (rec_ids, relevant)

    return compute_metrics(recs), recs


# ──────────────────────────────────────────────────────────────────────────────
# Zero-shot Prompting evaluation
# ──────────────────────────────────────────────────────────────────────────────

def evaluate_prompting(
    test_df: pd.DataFrame,
    user_histories: dict,
    all_items: list,
    title_map: dict,
    client: OpenAI,
) -> tuple[dict, dict]:
    recs = {}
    test_users = test_df["user_id"].unique().tolist()

    import random
    rng = random.Random(42)

    for uid in tqdm(test_users, desc="Prompting eval"):
        history = user_histories.get(uid, [])
        if not history:
            continue

        known_ids = set(h["item_id"] for h in history)
        pos_items = set(test_df[test_df["user_id"] == uid]["item_id"])
        forbidden = known_ids | pos_items
        pool = [iid for iid in all_items if iid not in forbidden]

        candidates = rng.sample(pool, min(PROMPTING_CANDIDATES, len(pool)))
        candidate_titles = [title_map.get(iid, iid) for iid in candidates]
        history_text = serialize_history(history)

        candidates_text = "\n".join(
            [f"{i+1}. {t}" for i, t in enumerate(candidate_titles)]
        )
        prompt = (
            f"Purchase History:\n{history_text}\n\n"
            f"Candidate Products:\n{candidates_text}\n\n"
            "Based on the purchase history, rank the top 10 candidate products "
            "the user is most likely to purchase next. "
            "Return only the product titles in a numbered list (1-10)."
        )

        output = llm_call(client, prompt)
        titles = parse_ranked_titles(output)
        rec_ids = titles_to_item_ids(titles, title_map)

        relevant = set(
            test_df.loc[(test_df["user_id"] == uid) & (test_df["label"] == 1), "item_id"]
        )
        recs[uid] = (rec_ids, relevant)

    return compute_metrics(recs), recs


# ──────────────────────────────────────────────────────────────────────────────
# Stratified analysis helpers
# ──────────────────────────────────────────────────────────────────────────────

def user_activity_group(n_train_interactions: int) -> str:
    if n_train_interactions <= 9:
        return "Cold (5-9)"
    elif n_train_interactions <= 29:
        return "Medium (10-29)"
    else:
        return "Active (30+)"


def item_popularity_group(n_item_interactions: int) -> str:
    if n_item_interactions <= 49:
        return "Niche (10-49)"
    elif n_item_interactions <= 199:
        return "Moderate (50-199)"
    else:
        return "Popular (200+)"


def stratified_ndcg(recs_dict: dict, user_group_map: dict, item_group_func=None) -> pd.DataFrame:
    """Compute NDCG@10 per group. recs_dict: {uid: (rec_list, relevant_set)}"""
    rows = []
    for uid, (rec, rel) in recs_dict.items():
        group = user_group_map.get(uid, "Unknown")
        ndcg = ndcg_at_k(rec, rel, K)
        rows.append({"user_id": uid, "group": group, "ndcg": ndcg})
    df = pd.DataFrame(rows)
    return df.groupby("group")["ndcg"].mean().round(4).reset_index().rename(columns={"ndcg": "NDCG@10"})


# ──────────────────────────────────────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────────────────────────────────────

def main():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set.")
    client = OpenAI(api_key=api_key)

    print("Loading test candidates...")
    test_df = pd.read_parquet(DATA_DIR / "test_candidates.parquet")
    with open(DATA_DIR / "feature_names.json") as f:
        feat_names = json.load(f)
    with open(DATA_DIR / "user_histories.json") as f:
        user_histories = json.load(f)
    with open(DATA_DIR / "chunk_metadata.json") as f:
        chunk_metadata = json.load(f)

    meta = pd.read_parquet(DATA_DIR / "item_meta.parquet")
    title_map = dict(zip(meta["item_id"], meta["title"].fillna("")))
    all_items = meta["item_id"].tolist()

    df_all = pd.read_parquet(DATA_DIR / "interactions_filtered.parquet")

    # User activity groups
    train_interactions = (
        df_all.groupby("user_id").size()
        .reset_index(name="n_train")
    )
    user_group_map = {
        row["user_id"]: user_activity_group(row["n_train"])
        for _, row in train_interactions.iterrows()
    }

    # Item popularity groups
    item_popularity = df_all.groupby("item_id").size().to_dict()

    print("Loading ML models...")
    with open(DATA_DIR / "rf_model.pkl", "rb") as f:
        rf_model = pickle.load(f)
    with open(DATA_DIR / "xgb_model.pkl", "rb") as f:
        xgb_model = pickle.load(f)

    print("Loading FAISS index...")
    faiss_index = faiss.read_index(str(DATA_DIR / "faiss_index.bin"))
    print(f"  FAISS index: {faiss_index.ntotal:,} vectors")

    results_rows = []

    # ── Random Forest ──────────────────────────────────────────────────────────
    print("\n[1/4] Evaluating Random Forest...")
    rf_metrics, rf_recs = evaluate_ml(rf_model, test_df, feat_names)
    results_rows.append({"Paradigm": "ML", "Model": "Random Forest", **rf_metrics})
    print(f"  {rf_metrics}")

    # ── XGBoost ────────────────────────────────────────────────────────────────
    print("\n[2/4] Evaluating XGBoost...")
    xgb_metrics, xgb_recs = evaluate_ml(xgb_model, test_df, feat_names)
    results_rows.append({"Paradigm": "ML", "Model": "XGBoost", **xgb_metrics})
    print(f"  {xgb_metrics}")

    # ── RAG ────────────────────────────────────────────────────────────────────
    print("\n[3/4] Evaluating RAG + GPT-3.5-turbo...")
    print("  (This will take ~1-3 hours depending on test set size + API latency)")
    rag_metrics, rag_recs = evaluate_rag(
        test_df, user_histories, faiss_index, chunk_metadata, title_map, client
    )
    results_rows.append({"Paradigm": "RAG", "Model": "RAG + GPT-3.5-turbo", **rag_metrics})
    print(f"  {rag_metrics}")

    # ── Zero-shot Prompting ─────────────────────────────────────────────────────
    print("\n[4/4] Evaluating Zero-Shot Prompting...")
    print("  (This will take ~2-4 hours)")
    prompt_metrics, prompt_recs = evaluate_prompting(
        test_df, user_histories, all_items, title_map, client
    )
    results_rows.append({"Paradigm": "Prompting", "Model": "Zero-Shot GPT-3.5", **prompt_metrics})
    print(f"  {prompt_metrics}")

    # ── Save accuracy table ─────────────────────────────────────────────────────
    accuracy_df = pd.DataFrame(results_rows)
    out = RESULTS_DIR / "accuracy_table.csv"
    accuracy_df.to_csv(out, index=False)
    print(f"\n{'='*60}")
    print("OVERALL ACCURACY RESULTS")
    print('='*60)
    print(accuracy_df.to_string(index=False))
    print(f"\nSaved → {out}")

    # ── Stratified by user activity ─────────────────────────────────────────────
    strat_rows = []
    for model_name, recs_dict in [
        ("Random Forest", rf_recs),
        ("XGBoost", xgb_recs),
        ("RAG + GPT-3.5", rag_recs),
        ("Zero-Shot GPT-3.5", prompt_recs),
    ]:
        grp_df = stratified_ndcg(recs_dict, user_group_map)
        for _, row in grp_df.iterrows():
            strat_rows.append({"Model": model_name, "Group": row["group"], "NDCG@10": row["NDCG@10"]})

    strat_df = pd.DataFrame(strat_rows)
    strat_pivot = strat_df.pivot(index="Model", columns="Group", values="NDCG@10")
    out2 = RESULTS_DIR / "accuracy_by_user_activity.csv"
    strat_pivot.to_csv(out2)
    print(f"\n{'='*60}")
    print("NDCG@10 BY USER ACTIVITY")
    print('='*60)
    print(strat_pivot.to_string())
    print(f"\nSaved → {out2}")

    # ── Stratified by item popularity ───────────────────────────────────────────
    pop_rows = []
    for model_name, recs_dict in [
        ("Random Forest", rf_recs),
        ("XGBoost", xgb_recs),
        ("RAG + GPT-3.5", rag_recs),
        ("Zero-Shot GPT-3.5", prompt_recs),
    ]:
        pop_ndcg: dict[str, list[float]] = {}
        for uid, (rec, rel) in recs_dict.items():
            ndcg = ndcg_at_k(rec, rel, K)
            # Assign NDCG to the popularity bucket of each test-positive item
            for iid in rel:
                n_pop = item_popularity.get(iid, 0)
                grp = item_popularity_group(n_pop)
                pop_ndcg.setdefault(grp, []).append(ndcg)

        for grp, vals in pop_ndcg.items():
            if vals:  # guard against empty list → no NaN
                pop_rows.append({"Model": model_name, "Group": grp, "NDCG@10": round(np.mean(vals), 4)})

    pop_df = pd.DataFrame(pop_rows)
    if not pop_df.empty:
        pop_pivot = pop_df.pivot_table(index="Model", columns="Group", values="NDCG@10", aggfunc="mean").round(4)
        out3 = RESULTS_DIR / "accuracy_by_item_popularity.csv"
        pop_pivot.to_csv(out3)
        print(f"\n{'='*60}")
        print("NDCG@10 BY ITEM POPULARITY")
        print('='*60)
        print(pop_pivot.to_string())
        print(f"\nSaved → {out3}")

    print("\nEvaluation complete.")


if __name__ == "__main__":
    main()
