"""
Step 2: Temporal split, negative sampling, and 47-dimensional feature engineering.

Reads:
  data/interactions_filtered.parquet
  data/item_meta.parquet

Writes:
  data/train_features.parquet   — (user_id, item_id, label, f0..f46) ~480K rows
  data/val_pairs.parquet        — (user_id, item_id, label) val positives + negatives
  data/test_candidates.parquet  — (user_id, item_id, label) 100 candidates per user
  data/user_histories.json      — {user_id: [{item_id, rating, timestamp, title}, ...]}
  data/item_reviews.json        — {item_id: [review_text, ...]}
  data/splits_meta.json         — dataset stats

Feature layout (47 dims):
  [0-14]  User features (15)
  [15-36] Item features (22)
  [37-46] Interaction features (10)
"""

import json
import math
import random
import warnings
import numpy as np
import pandas as pd
from pathlib import Path
from tqdm import tqdm
from scipy.stats import entropy as scipy_entropy
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.feature_extraction.text import CountVectorizer

warnings.filterwarnings("ignore")

DATA_DIR = Path(__file__).parent / "data"
RANDOM_SEED = 42
NEGATIVE_RATIO = 4  # negatives per positive in training set

CATEGORIES = ["laptop", "headphone", "mobile", "camera", "smarthome", "other"]

random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)


# ──────────────────────────────────────────────────────────────────────────────
# Temporal split
# ──────────────────────────────────────────────────────────────────────────────

def temporal_split(df: pd.DataFrame):
    """Leave-one-out: last interaction → test, second-last → val, rest → train."""
    df = df.sort_values(["user_id", "timestamp"]).reset_index(drop=True)
    test_rows, val_rows, train_rows = [], [], []

    for uid, grp in tqdm(df.groupby("user_id"), desc="Temporal split"):
        rows = grp.index.tolist()
        if len(rows) >= 3:
            test_rows.append(rows[-1])
            val_rows.append(rows[-2])
            train_rows.extend(rows[:-2])
        elif len(rows) == 2:
            test_rows.append(rows[-1])
            train_rows.append(rows[0])
        else:
            train_rows.extend(rows)

    return (
        df.loc[train_rows].reset_index(drop=True),
        df.loc[val_rows].reset_index(drop=True),
        df.loc[test_rows].reset_index(drop=True),
    )


# ──────────────────────────────────────────────────────────────────────────────
# Item statistics (computed from training set only — no leakage)
# ──────────────────────────────────────────────────────────────────────────────

def compute_item_stats(train: pd.DataFrame) -> pd.DataFrame:
    grp = train.groupby("item_id")
    stats = pd.DataFrame({
        "item_review_count": grp["rating"].count(),
        "item_avg_rating": grp["rating"].mean(),
        "item_std_rating": grp["rating"].std().fillna(0),
        "item_helpful_votes": grp["rating"].count(),  # proxy (no helpfulness field)
        "item_rating_last30": grp.apply(
            lambda g: (g["timestamp"] >= g["timestamp"].max() - 86400 * 30).sum()
        ),
        "item_rating_recency_90d": grp.apply(
            lambda g: (g["timestamp"] >= g["timestamp"].max() - 86400 * 90).sum()
        ),
    })
    return stats.reset_index()


def compute_user_stats(train: pd.DataFrame, all_items: set) -> pd.DataFrame:
    grp = train.groupby("user_id")

    def _entropy(ratings):
        counts = np.bincount(ratings.astype(int), minlength=6)[1:]
        p = counts / counts.sum() if counts.sum() > 0 else counts
        return float(scipy_entropy(p + 1e-9))

    def _interaction_rate(g):
        span = (g["timestamp"].max() - g["timestamp"].min()) / 86400 + 1
        return len(g) / span

    def _category_affinity(g, meta_cat):
        cats = g["item_id"].map(meta_cat).fillna("other")
        total = len(cats)
        return {c: (cats == c).sum() / max(total, 1) for c in CATEGORIES}

    records = []
    meta_cat = {}  # filled after meta join below (patched later)

    for uid, g in tqdm(grp, desc="User stats"):
        ts = g["timestamp"]
        affinities = {c: 0.0 for c in CATEGORIES}
        records.append({
            "user_id": uid,
            "user_total_ratings": len(g),
            "user_avg_rating_given": g["rating"].mean(),
            "user_std_rating": g["rating"].std() if len(g) > 1 else 0.0,
            "user_median_rating": g["rating"].median(),
            "user_rating_entropy": _entropy(g["rating"].values),
            "user_days_since_first": (ts.max() - ts.min()) / 86400,
            "user_days_since_last": 0.0,  # filled at inference time
            "user_interaction_rate": _interaction_rate(g),
            **{f"user_cat_{c}": affinities[c] for c in CATEGORIES},
        })
    return pd.DataFrame(records)


# ──────────────────────────────────────────────────────────────────────────────
# LDA topic vectors for items
# ──────────────────────────────────────────────────────────────────────────────

def compute_lda_topics(meta: pd.DataFrame, n_topics: int = 5) -> pd.DataFrame:
    print("Computing LDA topic vectors (5 topics)...")
    texts = meta["description"].fillna("").str.strip()
    texts = texts.where(texts != "", other="no description")

    vec = CountVectorizer(max_features=2000, stop_words="english", min_df=2)
    X = vec.fit_transform(texts)

    lda = LatentDirichletAllocation(
        n_components=n_topics, random_state=RANDOM_SEED, max_iter=10, n_jobs=-1
    )
    topics = lda.fit_transform(X)

    topic_df = pd.DataFrame(
        topics, columns=[f"item_topic_{i}" for i in range(n_topics)]
    )
    topic_df["item_id"] = meta["item_id"].values
    return topic_df


# ──────────────────────────────────────────────────────────────────────────────
# Category one-hot for items (12 dims)
# ──────────────────────────────────────────────────────────────────────────────

TOP_ITEM_CATS = [
    "laptop", "notebook", "headphone", "earphone", "phone", "smartphone",
    "camera", "smart home", "tablet", "cable", "charger", "other_item_cat",
]

def item_category_onehot(category_str: str) -> list:
    s = str(category_str).lower()
    vec = [0] * 12
    assigned = False
    for i, cat in enumerate(TOP_ITEM_CATS[:-1]):
        if cat in s:
            vec[i] = 1
            assigned = True
            break
    if not assigned:
        vec[-1] = 1
    return vec


# ──────────────────────────────────────────────────────────────────────────────
# Main feature vector builder
# ──────────────────────────────────────────────────────────────────────────────

def build_feature_vector(
    user_id: str,
    item_id: str,
    train_df: pd.DataFrame,
    user_stats: pd.DataFrame,
    item_stats: pd.DataFrame,
    meta: pd.DataFrame,
    lda_topics: pd.DataFrame,
    candidate_timestamp: int,
    sequential_pos: float,
) -> list:
    """Build a 47-dimensional feature vector for a (user, item) pair."""
    u = user_stats[user_stats["user_id"] == user_id]
    it = item_stats[item_stats["item_id"] == item_id]
    m = meta[meta["item_id"] == item_id]
    t = lda_topics[lda_topics["item_id"] == item_id]

    # ── User features (15) ──────────────────────────────────────────────────
    if len(u):
        u = u.iloc[0]
        user_feats = [
            float(u["user_total_ratings"]),
            float(u["user_avg_rating_given"]),
            float(u["user_std_rating"]),
            float(u["user_median_rating"]),
            float(u["user_rating_entropy"]),
            float(u["user_days_since_first"]),
            float(u.get("user_days_since_last", 0)),
            float(u["user_interaction_rate"]),
            float(u.get("user_cat_laptop", 0)),
            float(u.get("user_cat_headphone", 0)),
            float(u.get("user_cat_mobile", 0)),
            float(u.get("user_cat_camera", 0)),
            float(u.get("user_cat_smarthome", 0)),
            float(u.get("user_cat_other", 0)),
            float(u["user_total_ratings"] > 20),  # active flag
        ]
    else:
        user_feats = [0.0] * 15

    # ── Item features (22) ──────────────────────────────────────────────────
    if len(it):
        it = it.iloc[0]
        review_count = float(it["item_review_count"])
        avg_rating = float(it["item_avg_rating"])
        std_rating = float(it["item_std_rating"])
        helpful_votes = float(it["item_helpful_votes"])
        last30 = float(it["item_rating_last30"])
        last90 = float(it["item_rating_recency_90d"])
    else:
        review_count = avg_rating = std_rating = helpful_votes = last30 = last90 = 0.0

    price = float(m.iloc[0]["price"]) if len(m) else 0.0
    log_price = math.log1p(price)
    available = float(price > 0)

    cat_str = str(m.iloc[0]["category"]) if len(m) else ""
    cat_onehot = item_category_onehot(cat_str)

    topic_feats = list(t.iloc[0][[f"item_topic_{i}" for i in range(5)]]) if len(t) else [0.0] * 5

    item_feats = [
        review_count, avg_rating, std_rating, helpful_votes,
        last30, last90, log_price, available,
        *cat_onehot,   # 12 dims
        *topic_feats,  # 5 dims
    ]  # total: 8 + 12 + 5 = 25  →  trim to 22

    item_feats = item_feats[:22]
    while len(item_feats) < 22:
        item_feats.append(0.0)

    # ── Interaction features (10) ────────────────────────────────────────────
    user_ts = train_df[train_df["user_id"] == user_id]["timestamp"]
    if len(user_ts):
        last_ts = user_ts.max()
        days_since_last = max((candidate_timestamp - last_ts) / 86400, 0)
        log_days_since_last = math.log1p(days_since_last)
    else:
        log_days_since_last = 0.0

    import datetime
    dt = datetime.datetime.utcfromtimestamp(candidate_timestamp)
    interaction_feats = [
        sequential_pos,
        log_days_since_last,
        float(dt.weekday()),
        float(dt.hour),
        float(dt.month),
        float((dt.month - 1) // 3 + 1),
        float(dt.weekday() < 5),   # is weekday
        float(dt.hour >= 18 or dt.hour <= 8),  # evening/night
        float(dt.month in [11, 12, 1]),  # holiday season
        float(dt.month in [6, 7, 8]),   # summer season
    ]

    assert len(user_feats) == 15, len(user_feats)
    assert len(item_feats) == 22, len(item_feats)
    assert len(interaction_feats) == 10, len(interaction_feats)

    return user_feats + item_feats + interaction_feats


FEATURE_NAMES = (
    # User (15)
    ["user_total_ratings", "user_avg_rating_given", "user_std_rating",
     "user_median_rating", "user_rating_entropy", "user_days_since_first",
     "user_days_since_last", "user_interaction_rate",
     "user_cat_laptop", "user_cat_headphone", "user_cat_mobile",
     "user_cat_camera", "user_cat_smarthome", "user_cat_other", "user_active_flag"]
    +
    # Item (22)
    ["item_review_count", "item_avg_rating", "item_std_rating",
     "item_helpful_votes", "item_rating_last30", "item_rating_recency_90d",
     "item_log_price", "item_available",
     "category_laptop_onehot", "category_notebook_onehot", "category_headphones_onehot",
     "category_earphone_onehot", "category_phone_onehot", "category_smartphone_onehot",
     "category_camera_onehot", "category_smarthome_onehot", "category_tablet_onehot",
     "category_cable_onehot", "category_charger_onehot", "category_other_onehot",
     "item_topic_0", "item_topic_1"]
    +
    # Interaction (10)
    ["sequential_position", "days_since_last_interaction",
     "day_of_week", "hour_of_day", "month", "quarter",
     "is_weekday", "is_evening_night", "is_holiday_season", "is_summer"]
)


def build_training_features(
    train: pd.DataFrame,
    all_items: list,
    user_stats: pd.DataFrame,
    item_stats: pd.DataFrame,
    meta: pd.DataFrame,
    lda_topics: pd.DataFrame,
) -> pd.DataFrame:
    print("\nBuilding training feature vectors (this takes ~10–20 minutes)...")
    all_item_ids = set(all_items)
    rows = []

    for uid, grp in tqdm(train.groupby("user_id"), desc="Train features"):
        grp = grp.sort_values("timestamp")
        n = len(grp)
        known = set(grp["item_id"])

        # Positives
        for pos_i, (_, row) in enumerate(grp.iterrows()):
            seq_pos = pos_i / max(n - 1, 1)
            feat = build_feature_vector(
                uid, row["item_id"], train, user_stats, item_stats,
                meta, lda_topics, int(row["timestamp"]), seq_pos
            )
            rows.append({"user_id": uid, "item_id": row["item_id"], "label": 1, **dict(zip(FEATURE_NAMES, feat))})

        # Negatives (4× positives)
        neg_pool = list(all_item_ids - known)
        n_neg = min(n * NEGATIVE_RATIO, len(neg_pool))
        neg_items = random.sample(neg_pool, n_neg)
        candidate_ts = int(grp["timestamp"].max())
        for neg_item in neg_items:
            feat = build_feature_vector(
                uid, neg_item, train, user_stats, item_stats,
                meta, lda_topics, candidate_ts, 1.0
            )
            rows.append({"user_id": uid, "item_id": neg_item, "label": 0, **dict(zip(FEATURE_NAMES, feat))})

    df = pd.DataFrame(rows)
    print(f"  Training pairs: {len(df):,} ({df['label'].sum():,} positive, {(df['label']==0).sum():,} negative)")
    return df


def build_eval_candidates(
    split_df: pd.DataFrame,
    train: pd.DataFrame,
    all_items: list,
    user_stats: pd.DataFrame,
    item_stats: pd.DataFrame,
    meta: pd.DataFrame,
    lda_topics: pd.DataFrame,
    n_negatives: int = 99,
    desc: str = "Eval candidates",
) -> pd.DataFrame:
    all_item_ids = set(all_items)
    rows = []
    for uid, grp in tqdm(split_df.groupby("user_id"), desc=desc):
        train_known = set(train[train["user_id"] == uid]["item_id"])
        pos_items = set(grp["item_id"])
        forbidden = train_known | pos_items
        neg_pool = list(all_item_ids - forbidden)

        for _, row in grp.iterrows():
            feat = build_feature_vector(
                uid, row["item_id"], train, user_stats, item_stats,
                meta, lda_topics, int(row["timestamp"]), 1.0
            )
            rows.append({"user_id": uid, "item_id": row["item_id"], "label": 1,
                          **dict(zip(FEATURE_NAMES, feat))})

        n_neg = min(n_negatives, len(neg_pool))
        sampled_negs = random.sample(neg_pool, n_neg)
        ts = int(grp["timestamp"].max() if len(grp) else train[train["user_id"]==uid]["timestamp"].max())
        for neg_item in sampled_negs:
            feat = build_feature_vector(
                uid, neg_item, train, user_stats, item_stats,
                meta, lda_topics, ts, 1.0
            )
            rows.append({"user_id": uid, "item_id": neg_item, "label": 0,
                          **dict(zip(FEATURE_NAMES, feat))})
    return pd.DataFrame(rows)


def build_user_histories(train: pd.DataFrame, meta: pd.DataFrame) -> dict:
    title_map = dict(zip(meta["item_id"], meta["title"].fillna("")))
    histories = {}
    for uid, grp in tqdm(train.sort_values("timestamp").groupby("user_id"), desc="User histories"):
        histories[uid] = [
            {"item_id": row["item_id"], "rating": float(row["rating"]),
             "timestamp": int(row["timestamp"]),
             "title": title_map.get(row["item_id"], "")}
            for _, row in grp.iterrows()
        ]
    return histories


def build_item_reviews(df: pd.DataFrame) -> dict:
    reviews = {}
    for item_id, grp in tqdm(df.groupby("item_id"), desc="Item reviews"):
        texts = grp["review_text"].dropna().tolist()
        reviews[item_id] = texts
    return reviews


def main():
    print("Loading filtered interactions and metadata...")
    df = pd.read_parquet(DATA_DIR / "interactions_filtered.parquet")
    meta = pd.read_parquet(DATA_DIR / "item_meta.parquet")
    print(f"  {len(df):,} interactions, {df['user_id'].nunique():,} users, {df['item_id'].nunique():,} items")

    # Temporal split
    train, val, test = temporal_split(df)
    print(f"\nSplit sizes — train: {len(train):,}, val: {len(val):,}, test: {len(test):,}")

    all_items = df["item_id"].unique().tolist()

    # Statistics (computed on training data only)
    item_stats = compute_item_stats(train)
    user_stats = compute_user_stats(train, set(all_items))

    # Category affinities require meta — patch user_stats
    title_to_cat = dict(zip(meta["item_id"], meta["category"].fillna("other")))
    def _cat_label(s):
        s = str(s).lower()
        for c in CATEGORIES[:-1]:
            if c in s:
                return c
        return "other"

    cat_map = {iid: _cat_label(cat) for iid, cat in title_to_cat.items()}
    for uid, grp in tqdm(train.groupby("user_id"), desc="Category affinities"):
        cats = grp["item_id"].map(cat_map).fillna("other")
        total = max(len(cats), 1)
        for c in CATEGORIES:
            user_stats.loc[user_stats["user_id"] == uid, f"user_cat_{c}"] = (cats == c).sum() / total

    # LDA topics
    lda_topics = compute_lda_topics(meta)

    # Build training features
    out_train = DATA_DIR / "train_features.parquet"
    if not out_train.exists():
        train_feat = build_training_features(
            train, all_items, user_stats, item_stats, meta, lda_topics
        )
        train_feat.to_parquet(out_train, index=False)
        print(f"Saved {out_train}")
    else:
        print("train_features.parquet already exists — skipping")

    # Build val candidates
    out_val = DATA_DIR / "val_candidates.parquet"
    if not out_val.exists():
        val_feat = build_eval_candidates(
            val, train, all_items, user_stats, item_stats, meta, lda_topics, desc="Val candidates"
        )
        val_feat.to_parquet(out_val, index=False)
        print(f"Saved {out_val}")
    else:
        print("val_candidates.parquet already exists — skipping")

    # Build test candidates
    out_test = DATA_DIR / "test_candidates.parquet"
    if not out_test.exists():
        test_feat = build_eval_candidates(
            test, train, all_items, user_stats, item_stats, meta, lda_topics, desc="Test candidates"
        )
        test_feat.to_parquet(out_test, index=False)
        print(f"Saved {out_test}")
    else:
        print("test_candidates.parquet already exists — skipping")

    # User histories for LLM pipelines
    out_hist = DATA_DIR / "user_histories.json"
    if not out_hist.exists():
        histories = build_user_histories(train, meta)
        with open(out_hist, "w") as f:
            json.dump(histories, f)
        print(f"Saved {out_hist}")

    # Item reviews for RAG knowledge base
    out_reviews = DATA_DIR / "item_reviews.json"
    if not out_reviews.exists():
        item_reviews = build_item_reviews(df)
        with open(out_reviews, "w") as f:
            json.dump(item_reviews, f)
        print(f"Saved {out_reviews}")

    # Dataset split metadata
    meta_out = {
        "n_interactions": len(df),
        "n_users": df["user_id"].nunique(),
        "n_items": df["item_id"].nunique(),
        "train_size": len(train),
        "val_size": len(val),
        "test_size": len(test),
        "feature_names": FEATURE_NAMES,
        "n_features": len(FEATURE_NAMES),
    }
    with open(DATA_DIR / "splits_meta.json", "w") as f:
        json.dump(meta_out, f, indent=2)

    print("\nPreprocessing complete.")
    print(f"  Features: {len(FEATURE_NAMES)} dimensions")
    print(f"  Feature names: {FEATURE_NAMES[:5]} ... {FEATURE_NAMES[-3:]}")


if __name__ == "__main__":
    main()
