"""
Step 7: Per-user inference latency benchmark.

Measures median wall-clock time per user over 5 independent runs,
on a random sample of 500 test users (seed=42).

Reports median, P5, P95 latency in milliseconds, plus latency breakdown
(feature extraction vs model call).

Reads:
  data/test_candidates.parquet
  data/user_histories.json
  data/rf_model.pkl
  data/xgb_model.pkl
  data/faiss_index.bin
  data/chunk_metadata.json
  data/feature_names.json
  data/item_meta.parquet

Writes:
  results/latency_table.csv
  results/latency_breakdown.csv
"""

import json
import os
import pickle
import random
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

N_USERS = 500
N_RUNS = 5
RANDOM_SEED = 42
EMBED_MODEL = "text-embedding-3-small"
LLM_MODEL = "gpt-3.5-turbo-0125"
RAG_TOP_CHUNKS = 5
PROMPTING_CANDIDATES = 20
MAX_RETRIES = 4


def serialize_history(history: list, max_items: int = 20) -> str:
    history = sorted(history, key=lambda x: x["timestamp"])[-max_items:]
    lines = [f"- {h.get('title', h['item_id'])} (rated {h.get('rating','?')}/5)" for h in history]
    return "\n".join(lines)


def llm_call(client, messages):
    for attempt in range(MAX_RETRIES):
        try:
            resp = client.chat.completions.create(
                model=LLM_MODEL,
                messages=messages,
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
    return ""  # unreachable


def embed_single(client, text):
    for attempt in range(MAX_RETRIES):
        try:
            resp = client.embeddings.create(model=EMBED_MODEL, input=[text])
            return np.array(resp.data[0].embedding, dtype=np.float32).reshape(1, -1)
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(2 ** attempt)
            else:
                raise


def measure_ml_latency(model, test_df, feat_names, user_ids):
    """Returns list of (total_ms, feat_extract_ms, model_call_ms) per user."""
    latencies = []
    feat_cols = [c for c in feat_names if c in test_df.columns]

    for uid in user_ids:
        user_df = test_df[test_df["user_id"] == uid]
        if len(user_df) == 0:
            continue

        t0 = time.perf_counter()
        X = user_df[feat_cols].values.astype(np.float32)
        t1 = time.perf_counter()
        scores = model.predict_proba(X)[:, 1]
        t2 = time.perf_counter()

        feat_ms = (t1 - t0) * 1000
        model_ms = (t2 - t1) * 1000
        total_ms = (t2 - t0) * 1000
        latencies.append((total_ms, feat_ms, model_ms))

    return latencies


def measure_rag_latency(client, faiss_index, chunk_metadata, user_histories, user_ids):
    """Returns list of (total_ms, retrieval_ms, llm_ms) per user."""
    latencies = []

    for uid in tqdm(user_ids, desc="  RAG latency", leave=False):
        history = user_histories.get(uid, [])
        if not history:
            continue

        query_text = "Purchase history:\n" + serialize_history(history)

        t0 = time.perf_counter()
        query_vec = embed_single(client, query_text)
        _distances, indices = faiss_index.search(query_vec, RAG_TOP_CHUNKS)
        retrieved_chunks = [
            chunk_metadata[idx]["text"]
            for idx in indices[0]
            if idx < len(chunk_metadata)
        ]
        t1 = time.perf_counter()

        context = "\n\n".join([f"Review {i+1}: {c[:300]}" for i, c in enumerate(retrieved_chunks)])
        history_text = serialize_history(history)
        prompt = (
            f"Purchase History:\n{history_text}\n\n"
            f"Relevant Customer Reviews:\n{context}\n\n"
            "Recommend exactly 10 electronics products the user would most likely purchase next. "
            "Return only product titles in a numbered list."
        )
        llm_call(client, [
            {"role": "system", "content": "You are a helpful e-commerce recommendation assistant."},
            {"role": "user", "content": prompt},
        ])
        t2 = time.perf_counter()

        retrieval_ms = (t1 - t0) * 1000
        llm_ms = (t2 - t1) * 1000
        total_ms = (t2 - t0) * 1000
        latencies.append((total_ms, retrieval_ms, llm_ms))

    return latencies


def measure_prompting_latency(client, user_histories, all_items, title_map, user_ids):
    """Returns list of (total_ms, 0, llm_ms) per user."""
    latencies = []
    rng = random.Random(RANDOM_SEED)

    for uid in tqdm(user_ids, desc="  Prompting latency", leave=False):
        history = user_histories.get(uid, [])
        if not history:
            continue

        known_ids = set(h["item_id"] for h in history)
        pool = [iid for iid in all_items if iid not in known_ids]
        candidates = rng.sample(pool, min(PROMPTING_CANDIDATES, len(pool)))
        candidate_titles = [title_map.get(iid, iid) for iid in candidates]
        history_text = serialize_history(history)
        candidates_text = "\n".join([f"{i+1}. {t}" for i, t in enumerate(candidate_titles)])

        t0 = time.perf_counter()
        prompt = (
            f"Purchase History:\n{history_text}\n\n"
            f"Candidate Products:\n{candidates_text}\n\n"
            "Rank the top 10 candidates the user is most likely to purchase. "
            "Return only product titles in a numbered list (1-10)."
        )
        llm_call(client, [
            {"role": "system", "content": "You are a helpful e-commerce recommendation assistant."},
            {"role": "user", "content": prompt},
        ])
        t1 = time.perf_counter()

        total_ms = (t1 - t0) * 1000
        latencies.append((total_ms, 0.0, total_ms))

    return latencies


def summarize_latencies(all_run_latencies: list) -> dict:
    """Flatten runs and compute median, P5, P95."""
    totals = [t for run in all_run_latencies for t, _, _ in run]
    feat_parts = [f for run in all_run_latencies for _, f, _ in run]
    model_parts = [m for run in all_run_latencies for _, _, m in run]

    return {
        "median_ms": round(np.median(totals), 1),
        "p5_ms": round(np.percentile(totals, 5), 1),
        "p95_ms": round(np.percentile(totals, 95), 1),
        "feat_extract_median_ms": round(np.median(feat_parts), 1),
        "model_call_median_ms": round(np.median(model_parts), 1),
        "n_measurements": len(totals),
    }


def main():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set.")
    client = OpenAI(api_key=api_key)

    print("Loading data and models...")
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

    with open(DATA_DIR / "rf_model.pkl", "rb") as f:
        rf_model = pickle.load(f)
    with open(DATA_DIR / "xgb_model.pkl", "rb") as f:
        xgb_model = pickle.load(f)

    faiss_index = faiss.read_index(str(DATA_DIR / "faiss_index.bin"))

    # Sample 500 users with fixed seed
    all_test_users = test_df["user_id"].unique().tolist()
    rng = random.Random(RANDOM_SEED)
    sampled_users = rng.sample(all_test_users, min(N_USERS, len(all_test_users)))
    print(f"Sampled {len(sampled_users)} test users for latency benchmark")
    print(f"Running {N_RUNS} independent passes per model\n")

    results = {}

    # ── Random Forest ──────────────────────────────────────────────────────────
    print(f"[1/4] Random Forest — {N_RUNS} runs × {len(sampled_users)} users")
    rf_runs = []
    for run in range(N_RUNS):
        lats = measure_ml_latency(rf_model, test_df, feat_names, sampled_users)
        rf_runs.append(lats)
        print(f"  Run {run+1}: median {np.median([t for t,_,_ in lats]):.1f}ms")
    results["Random Forest"] = summarize_latencies(rf_runs)

    # ── XGBoost ────────────────────────────────────────────────────────────────
    print(f"\n[2/4] XGBoost — {N_RUNS} runs × {len(sampled_users)} users")
    xgb_runs = []
    for run in range(N_RUNS):
        lats = measure_ml_latency(xgb_model, test_df, feat_names, sampled_users)
        xgb_runs.append(lats)
        print(f"  Run {run+1}: median {np.median([t for t,_,_ in lats]):.1f}ms")
    results["XGBoost"] = summarize_latencies(xgb_runs)

    xgb_median = results["XGBoost"]["median_ms"]

    # ── RAG ────────────────────────────────────────────────────────────────────
    print(f"\n[3/4] RAG + GPT-3.5-turbo — {N_RUNS} runs × {len(sampled_users)} users")
    print("  (WARNING: this takes ~30–60 min per run due to API calls)")
    rag_runs = []
    for run in range(N_RUNS):
        print(f"  Run {run+1}...")
        lats = measure_rag_latency(client, faiss_index, chunk_metadata, user_histories, sampled_users)
        rag_runs.append(lats)
        print(f"  Run {run+1}: median {np.median([t for t,_,_ in lats]):.1f}ms")
    results["RAG + GPT-3.5-turbo"] = summarize_latencies(rag_runs)

    # ── Zero-shot Prompting ─────────────────────────────────────────────────────
    print(f"\n[4/4] Zero-Shot Prompting — {N_RUNS} runs × {len(sampled_users)} users")
    prompt_runs = []
    for run in range(N_RUNS):
        print(f"  Run {run+1}...")
        lats = measure_prompting_latency(client, user_histories, all_items, title_map, sampled_users)
        prompt_runs.append(lats)
        print(f"  Run {run+1}: median {np.median([t for t,_,_ in lats]):.1f}ms")
    results["Zero-Shot GPT-3.5"] = summarize_latencies(prompt_runs)

    # ── Summary table ───────────────────────────────────────────────────────────
    print(f"\n{'='*72}")
    print("LATENCY RESULTS (ms) — Median and Percentiles")
    print("="*72)
    print(f"{'Model':<26}{'Median':>10}{'P5':>8}{'P95':>8}{'vs XGBoost':>12}{'Feat.Ext':>10}{'Model Call':>12}")
    print("-"*72)

    rows = []
    for model_name, stats in results.items():
        ratio = ""
        if xgb_median > 0:
            r = stats["median_ms"] / xgb_median
            ratio = f"x{r:.0f}" if r > 2 else f"+{r*100-100:.0f}%"
        print(f"{model_name:<26}{stats['median_ms']:>10.1f}{stats['p5_ms']:>8.1f}"
              f"{stats['p95_ms']:>8.1f}{ratio:>12}"
              f"{stats['feat_extract_median_ms']:>10.1f}"
              f"{stats['model_call_median_ms']:>12.1f}")
        rows.append({
            "Model": model_name,
            "Median (ms)": stats["median_ms"],
            "P5 (ms)": stats["p5_ms"],
            "P95 (ms)": stats["p95_ms"],
            "vs XGBoost": ratio,
            "Feat Extract (ms)": stats["feat_extract_median_ms"],
            "Model Call (ms)": stats["model_call_median_ms"],
        })

    lat_df = pd.DataFrame(rows)
    out = RESULTS_DIR / "latency_table.csv"
    lat_df.to_csv(out, index=False)
    print(f"\nSaved → {out}")
    print("\nLatency benchmark complete.")


if __name__ == "__main__":
    main()
