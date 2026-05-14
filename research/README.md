# Thesis Research Pipeline

Implements the three recommendation paradigms from the thesis:
**"Analyzing and Comparing Three Recommendation Paradigms: ML, RAG, and Prompting-Based Systems"**

## Setup

```bash
cd research/
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and add your OpenAI API key:
#   OPENAI_API_KEY=sk-...
```

## Run Order

Run scripts **in order**. Each script checks for existing output and skips if already done.

### Step 1 — Download & filter dataset (~10 min, ~500MB download)
```bash
python 01_data_download.py
```
Downloads Amazon Electronics 2023 from HuggingFace, applies 5-core filtering.
Target: ~120K interactions, ~18K users, ~6K items.

### Step 2 — Preprocess & feature engineering (~15–30 min)
```bash
python 02_preprocess.py
```
- Temporal leave-one-out split (last interaction = test, second-last = val)
- 99 random negatives per test user → 100 candidates per user
- Builds 47-dimensional feature vectors for ML training (~480K labeled pairs)
- Saves user histories and item reviews for LLM pipelines

### Step 3 — Train ML models (~30 min)
```bash
python 03_ml_train.py
```
Trains Random Forest (200 trees) and XGBoost (500 rounds + early stopping).

### Step 4 — Build RAG index (~45–90 min, costs ~$3 in OpenAI API)
```bash
python 04_rag_index.py
```
Chunks ~280K review segments, embeds with `text-embedding-3-small`, indexes in FAISS flat L2.

### Step 5 — Evaluate all models (ML: minutes; LLM: 4–8 hours)
```bash
python 05_evaluate.py
```
Runs unified evaluation harness across all 4 models.
**Tip**: Start this overnight. ML evaluation finishes in <5 minutes; LLM evaluation
takes several hours (each user = 1 API call). Outputs are saved continuously.

### Step 6 — SHAP analysis (~5 min, requires step 3)
```bash
python 06_shap_analysis.py
```
Computes SHAP feature importance for XGBoost, top-10 table, Gini score.

### Step 7 — Latency benchmark (ML: <1 min; LLM: 3–5 hours)
```bash
python 07_latency_benchmark.py
```
5 independent runs × 500 sampled users. Reports median/P5/P95 ms per model.

## Output Files

All results are written to `results/`:

| File | Contents |
|------|---------|
| `accuracy_table.csv` | Precision@10, Recall@10, NDCG@10 (all 4 models) |
| `accuracy_by_user_activity.csv` | NDCG@10 by cold/medium/active users |
| `accuracy_by_item_popularity.csv` | NDCG@10 by niche/moderate/popular items |
| `latency_table.csv` | Median/P5/P95 latency in ms |
| `shap_top10.csv` | Top-10 XGBoost features by mean \|SHAP\| |
| `shap_gini_score.txt` | Gini concentration score |
| `shap_all_features.csv` | Full SHAP importance ranking |

## Estimated OpenAI API Cost

| Step | Model | Estimated Cost |
|------|-------|---------------|
| Step 4 (indexing) | text-embedding-3-small | ~$3 |
| Step 5 (RAG eval, 18K users) | text-embedding-3-small + gpt-3.5-turbo | ~$15–25 |
| Step 5 (Prompting eval, 18K users) | gpt-3.5-turbo | ~$10–18 |
| Step 7 (latency, 500×5 users) | both models | ~$4–6 |
| **Total** | | **~$35–55** |

To reduce cost during testing, edit `N_USERS` in `07_latency_benchmark.py`
and `RANDOM_SEED` sample size in `05_evaluate.py`.

## Hardware Requirements

- RAM: 8GB minimum (16GB recommended for feature engineering)
- Disk: ~5GB for data + models + index
- CPU: Multi-core recommended (training uses `n_jobs=-1`)
- GPU: Not required (CPU-only inference for ML; API for LLM)

## Reproducing Thesis Results

The scripts use `random_seed=42` everywhere. Results should be directionally
consistent with the thesis (RAG > XGBoost on cold users; XGBoost fastest latency;
etc.). Exact values will differ from the thesis as those were simulated —
your real numbers are more valuable and fully defensible.
