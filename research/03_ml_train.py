"""
Step 3: Train Random Forest and XGBoost recommendation models.

Reads:
  data/train_features.parquet
  data/val_candidates.parquet
  data/splits_meta.json

Writes:
  data/rf_model.pkl
  data/xgb_model.pkl
  data/feature_names.json
"""

import json
import pickle
import warnings
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score
import xgboost as xgb

warnings.filterwarnings("ignore")

DATA_DIR = Path(__file__).parent / "data"
RANDOM_SEED = 42


def load_xy(path: Path):
    df = pd.read_parquet(path)
    with open(DATA_DIR / "splits_meta.json") as f:
        meta = json.load(f)
    feat_names = meta["feature_names"]
    feat_names = [c for c in feat_names if c in df.columns]
    X = df[feat_names].values.astype(np.float32)
    y = df["label"].values.astype(np.int32)
    return X, y, feat_names, df


def ndcg_at_k(user_scores: dict, k: int = 10) -> float:
    """Compute mean NDCG@k from {user_id: [(score, label), ...]}."""
    ndcgs = []
    for uid, pairs in user_scores.items():
        pairs_sorted = sorted(pairs, key=lambda x: -x[0])
        dcg = sum(
            (2 ** pairs_sorted[i][1] - 1) / np.log2(i + 2)
            for i in range(min(k, len(pairs_sorted)))
        )
        ideal = sorted([p[1] for p in pairs], reverse=True)
        idcg = sum(
            (2 ** ideal[i] - 1) / np.log2(i + 2)
            for i in range(min(k, len(ideal)))
        )
        ndcgs.append(dcg / idcg if idcg > 0 else 0.0)
    return float(np.mean(ndcgs))


def evaluate_model(model, val_df: pd.DataFrame, feat_names: list, k: int = 10) -> dict:
    X_val = val_df[feat_names].values.astype(np.float32)
    scores = model.predict_proba(X_val)[:, 1]
    val_df = val_df.copy()
    val_df["score"] = scores

    user_scores = {}
    for uid, grp in val_df.groupby("user_id"):
        user_scores[uid] = list(zip(grp["score"], grp["label"]))

    ndcg = ndcg_at_k(user_scores, k)
    auc = roc_auc_score(val_df["label"], val_df["score"])
    return {"NDCG@10": ndcg, "AUC": auc}


def train_random_forest(X_train, y_train, val_df, feat_names):
    print("\n─── Random Forest ───────────────────────────────────────────")
    print(f"  Training on {len(X_train):,} samples, {X_train.shape[1]} features")
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_leaf=5,
        max_features="sqrt",
        criterion="gini",
        bootstrap=True,
        n_jobs=-1,
        random_state=RANDOM_SEED,
        verbose=1,
    )
    rf.fit(X_train, y_train)
    metrics = evaluate_model(rf, val_df, feat_names)
    print(f"  Val NDCG@10: {metrics['NDCG@10']:.4f}  |  AUC: {metrics['AUC']:.4f}")

    out = DATA_DIR / "rf_model.pkl"
    with open(out, "wb") as f:
        pickle.dump(rf, f)
    print(f"  Saved → {out}")
    return rf


def train_xgboost(X_train, y_train, val_df, feat_names):
    print("\n─── XGBoost ─────────────────────────────────────────────────")
    print(f"  Training on {len(X_train):,} samples, {X_train.shape[1]} features")

    X_val = val_df[feat_names].values.astype(np.float32)
    y_val = val_df["label"].values.astype(np.int32)

    dtrain = xgb.DMatrix(X_train, label=y_train, feature_names=feat_names)
    dval = xgb.DMatrix(X_val, label=y_val, feature_names=feat_names)

    params = {
        "objective": "binary:logistic",
        "eta": 0.05,
        "max_depth": 8,
        "min_child_weight": 5,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "colsample_bylevel": 0.9,
        "lambda": 1.0,
        "alpha": 0.1,
        "eval_metric": "auc",
        "seed": RANDOM_SEED,
        "nthread": -1,
    }

    callbacks = [xgb.callback.EarlyStopping(rounds=30, metric_name="auc",
                                             data_name="val", save_best=True)]
    model = xgb.train(
        params,
        dtrain,
        num_boost_round=500,
        evals=[(dval, "val")],
        verbose_eval=50,
        callbacks=callbacks,
    )

    # Wrap in sklearn-compatible class for uniform predict_proba interface
    xgb_clf = xgb.XGBClassifier(
        n_estimators=model.best_iteration + 1,
        learning_rate=0.05,
        max_depth=8,
        min_child_weight=5,
        subsample=0.8,
        colsample_bytree=0.8,
        colsample_bylevel=0.9,
        reg_lambda=1.0,
        reg_alpha=0.1,
        objective="binary:logistic",
        eval_metric="auc",
        random_state=RANDOM_SEED,
        n_jobs=-1,
        use_label_encoder=False,
    )
    xgb_clf.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    metrics = evaluate_model(xgb_clf, val_df, feat_names)
    print(f"  Val NDCG@10: {metrics['NDCG@10']:.4f}  |  AUC: {metrics['AUC']:.4f}")

    out = DATA_DIR / "xgb_model.pkl"
    with open(out, "wb") as f:
        pickle.dump(xgb_clf, f)
    print(f"  Saved → {out}")
    return xgb_clf


def main():
    # Load training data
    print("Loading training features...")
    X_train, y_train, feat_names, train_df = load_xy(DATA_DIR / "train_features.parquet")
    print(f"  X_train: {X_train.shape}, positives: {y_train.sum():,}")

    print("Loading validation candidates...")
    _, _, _, val_df = load_xy(DATA_DIR / "val_candidates.parquet")
    feat_names_val = [c for c in feat_names if c in val_df.columns]

    with open(DATA_DIR / "feature_names.json", "w") as f:
        json.dump(feat_names, f)
    print(f"  Feature names saved ({len(feat_names)} features)")

    # Train models
    rf_out = DATA_DIR / "rf_model.pkl"
    xgb_out = DATA_DIR / "xgb_model.pkl"

    if not rf_out.exists():
        train_random_forest(X_train, y_train, val_df, feat_names_val)
    else:
        print("rf_model.pkl already exists — skipping RF training")

    if not xgb_out.exists():
        train_xgboost(X_train, y_train, val_df, feat_names_val)
    else:
        print("xgb_model.pkl already exists — skipping XGBoost training")

    print("\nML training complete.")


if __name__ == "__main__":
    main()
