"""
Step 6: SHAP feature importance analysis for the XGBoost model.

Computes:
  - Mean |SHAP| per feature over 1000 sampled test predictions
  - Top-10 most influential features (Table 4.6 in thesis)
  - Gini concentration score of feature importance distribution

Reads:
  data/xgb_model.pkl
  data/test_candidates.parquet
  data/feature_names.json

Writes:
  results/shap_top10.csv
  results/shap_gini_score.txt
"""

import json
import pickle
import warnings
import numpy as np
import pandas as pd
import shap
from pathlib import Path

warnings.filterwarnings("ignore")

DATA_DIR = Path(__file__).parent / "data"
RESULTS_DIR = Path(__file__).parent / "results"
RESULTS_DIR.mkdir(exist_ok=True)

N_SAMPLE = 1000
RANDOM_SEED = 42

FEATURE_INTERPRETATION = {
    "item_avg_rating": "Higher-rated items preferred",
    "user_avg_rating_given": "Calibrates to user's rating scale",
    "item_review_count": "Popularity signal",
    "user_total_ratings": "User activity level",
    "item_rating_recency_90d": "Trending items preferred",
    "user_rating_entropy": "Discriminating vs. lenient raters",
    "item_log_price": "Price tier alignment",
    "sequential_position": "Recency of similar items",
    "category_headphones_onehot": "Category preference signal",
    "days_since_last_interaction": "User engagement recency",
    "user_std_rating": "User rating variance",
    "item_std_rating": "Item quality consistency",
    "user_interaction_rate": "User engagement frequency",
    "item_rating_last30": "Short-term popularity trend",
    "item_topic_0": "Latent topic alignment",
}


def gini_coefficient(values: np.ndarray) -> float:
    """Gini coefficient of a non-negative array (0 = perfectly equal, 1 = maximally concentrated)."""
    values = np.sort(np.abs(values))
    n = len(values)
    if n == 0 or values.sum() == 0:
        return 0.0
    cumsum = np.cumsum(values)
    return float((2 * np.sum(cumsum) - (n + 1) * values.sum()) / (n * values.sum()))


def main():
    print("Loading XGBoost model and test data...")
    with open(DATA_DIR / "xgb_model.pkl", "rb") as f:
        xgb_model = pickle.load(f)

    test_df = pd.read_parquet(DATA_DIR / "test_candidates.parquet")

    with open(DATA_DIR / "feature_names.json") as f:
        feat_names = json.load(f)

    feat_cols = [c for c in feat_names if c in test_df.columns]
    X_test = test_df[feat_cols].values.astype(np.float32)

    # Sample N_SAMPLE predictions
    rng = np.random.RandomState(RANDOM_SEED)
    n = min(N_SAMPLE, len(X_test))
    idx = rng.choice(len(X_test), n, replace=False)
    X_sample = X_test[idx]

    print(f"\nComputing SHAP values for {n} sampled test predictions...")
    explainer = shap.TreeExplainer(xgb_model)
    shap_values = explainer.shap_values(X_sample)

    # For binary classification XGBoost, shap_values may be 2D or a list
    if isinstance(shap_values, list):
        shap_vals = shap_values[1]
    else:
        shap_vals = shap_values

    # Mean absolute SHAP per feature
    mean_abs_shap = np.abs(shap_vals).mean(axis=0)

    # Sort and display top features
    ranked_idx = np.argsort(mean_abs_shap)[::-1]
    feat_names_array = np.array(feat_cols)

    print("\n" + "="*72)
    print(f"{'Rank':<6}{'Feature':<35}{'Mean |SHAP|':<14}{'Interpretation'}")
    print("="*72)

    top_rows = []
    for rank, i in enumerate(ranked_idx[:10], 1):
        fname = feat_names_array[i]
        val = float(mean_abs_shap[i])
        interp = FEATURE_INTERPRETATION.get(fname, "")
        print(f"{rank:<6}{fname:<35}{val:<14.4f}{interp}")
        top_rows.append({
            "Rank": rank,
            "Feature Name": fname,
            "Mean |SHAP|": round(val, 4),
            "Interpretation": interp,
        })

    # Gini concentration score
    gini = gini_coefficient(mean_abs_shap)
    print("="*72)
    print(f"\nGini concentration score: {gini:.4f}")
    print("  (Higher = more concentrated attribution; >0.7 = good explainability)")

    # Save results
    top_df = pd.DataFrame(top_rows)
    out_csv = RESULTS_DIR / "shap_top10.csv"
    top_df.to_csv(out_csv, index=False)
    print(f"\nSaved → {out_csv}")

    out_gini = RESULTS_DIR / "shap_gini_score.txt"
    with open(out_gini, "w") as f:
        f.write(f"XGBoost SHAP Gini Concentration Score: {gini:.4f}\n")
        f.write(f"Computed over {n} sampled test predictions\n")
        f.write(f"Total features: {len(feat_cols)}\n")
    print(f"Saved → {out_gini}")

    # Full feature importance table
    full_rows = []
    for i in ranked_idx:
        full_rows.append({
            "Feature": feat_names_array[i],
            "Mean |SHAP|": round(float(mean_abs_shap[i]), 6),
        })
    full_df = pd.DataFrame(full_rows)
    full_df.to_csv(RESULTS_DIR / "shap_all_features.csv", index=False)
    print(f"Saved → {RESULTS_DIR / 'shap_all_features.csv'}")

    print("\nSHAP analysis complete.")


if __name__ == "__main__":
    main()
