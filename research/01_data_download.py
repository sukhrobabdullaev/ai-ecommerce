"""
Step 1: Download Amazon Electronics 2023 dataset and apply 5-core filtering.

Output files (written to data/):
  - interactions_filtered.parquet  (user_id, item_id, rating, timestamp, review_text, title)
  - item_meta.parquet              (item_id, title, price, category, description)

5-core filter: keep users with >= 5 ratings AND items with >= 10 ratings.
Target after filtering: ~120K interactions, ~18K users, ~6K items.
"""

import os
import json
import pandas as pd
from pathlib import Path
from tqdm import tqdm
from datasets import load_dataset

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

USER_MIN = 5
ITEM_MIN = 10


def download_reviews() -> pd.DataFrame:
    print("Downloading Electronics reviews from HuggingFace...")
    ds = load_dataset(
        "McAuley-Lab/Amazon-Reviews-2023",
        "raw_review_Electronics",
        split="full",
    )
    df = ds.to_pandas()
    print(f"  Raw reviews: {len(df):,} rows")

    df = df.rename(columns={
        "user_id": "user_id",
        "parent_asin": "item_id",
        "rating": "rating",
        "timestamp": "timestamp",
        "text": "review_text",
        "title": "review_title",
    })
    keep_cols = ["user_id", "item_id", "rating", "timestamp", "review_text", "review_title"]
    df = df[[c for c in keep_cols if c in df.columns]].copy()

    df["rating"] = pd.to_numeric(df["rating"], errors="coerce")
    df["timestamp"] = pd.to_numeric(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["user_id", "item_id", "rating", "timestamp"])
    df["rating"] = df["rating"].astype(float)
    df["timestamp"] = df["timestamp"].astype(int)
    return df


def download_meta() -> pd.DataFrame:
    print("Downloading Electronics metadata from HuggingFace...")
    ds = load_dataset(
        "McAuley-Lab/Amazon-Reviews-2023",
        "raw_meta_Electronics",
        split="full",
    )
    df = ds.to_pandas()
    print(f"  Raw meta: {len(df):,} rows")

    df = df.rename(columns={"parent_asin": "item_id"})
    keep_cols = ["item_id", "title", "price", "main_category", "description", "features"]
    df = df[[c for c in keep_cols if c in df.columns]].copy()
    df = df.rename(columns={"main_category": "category"})

    if "description" in df.columns:
        df["description"] = df["description"].apply(
            lambda x: " ".join(x) if isinstance(x, list) else (x or "")
        )
    if "features" in df.columns:
        df["features"] = df["features"].apply(
            lambda x: " ".join(x) if isinstance(x, list) else (x or "")
        )
        df["description"] = df.get("description", "") + " " + df["features"]
        df.drop(columns=["features"], inplace=True)

    df["price"] = pd.to_numeric(df["price"], errors="coerce").fillna(0.0)
    return df.drop_duplicates(subset=["item_id"])


def apply_kcore(df: pd.DataFrame, user_min: int, item_min: int) -> pd.DataFrame:
    """Iteratively remove users < user_min and items < item_min until stable."""
    print(f"\nApplying {user_min}-core (users) / {item_min}-core (items) filter...")
    prev_len = -1
    iteration = 0
    while len(df) != prev_len:
        prev_len = len(df)
        iteration += 1
        item_counts = df["item_id"].value_counts()
        df = df[df["item_id"].isin(item_counts[item_counts >= item_min].index)]
        user_counts = df["user_id"].value_counts()
        df = df[df["user_id"].isin(user_counts[user_counts >= user_min].index)]
        print(f"  Iteration {iteration}: {len(df):,} interactions, "
              f"{df['user_id'].nunique():,} users, {df['item_id'].nunique():,} items")
    return df.reset_index(drop=True)


def main():
    out_interactions = DATA_DIR / "interactions_filtered.parquet"
    out_meta = DATA_DIR / "item_meta.parquet"

    if out_interactions.exists() and out_meta.exists():
        print("Filtered data already exists — skipping download.")
        df = pd.read_parquet(out_interactions)
        print(f"  Loaded {len(df):,} interactions, "
              f"{df['user_id'].nunique():,} users, {df['item_id'].nunique():,} items")
        return

    reviews = download_reviews()
    meta = download_meta()

    filtered = apply_kcore(reviews, USER_MIN, ITEM_MIN)

    # Keep only items that have metadata
    items_with_meta = set(meta["item_id"])
    filtered = filtered[filtered["item_id"].isin(items_with_meta)]
    # Re-apply filter after meta join
    filtered = apply_kcore(filtered, USER_MIN, ITEM_MIN)

    meta_filtered = meta[meta["item_id"].isin(filtered["item_id"].unique())].copy()

    print("\nFinal dataset:")
    print(f"  Interactions : {len(filtered):,}")
    print(f"  Users        : {filtered['user_id'].nunique():,}")
    print(f"  Items        : {filtered['item_id'].nunique():,}")

    filtered.to_parquet(out_interactions, index=False)
    meta_filtered.to_parquet(out_meta, index=False)
    print(f"\nSaved to {out_interactions}")
    print(f"Saved to {out_meta}")


if __name__ == "__main__":
    main()
