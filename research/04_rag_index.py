"""
Step 4: Build the RAG knowledge base — chunk reviews, embed with
text-embedding-3-small, index with FAISS flat L2.

Reads:
  data/item_reviews.json   — {item_id: [review_text, ...]}
  data/item_meta.parquet   — item titles

Writes:
  data/faiss_index.bin     — FAISS flat L2 index
  data/chunk_metadata.json — [{item_id, title, text, chunk_idx}, ...]

OpenAI API cost estimate:
  ~280K chunks × 512 tokens avg = ~143M tokens
  text-embedding-3-small = $0.02 / 1M tokens ≈ $2.86 total
"""

import json
import os
import time
import faiss
import numpy as np
import pandas as pd
import tiktoken
from pathlib import Path
from tqdm import tqdm
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

DATA_DIR = Path(__file__).parent / "data"
EMBED_MODEL = "text-embedding-3-small"
EMBED_DIM = 1536
CHUNK_SIZE = 512    # tokens
CHUNK_OVERLAP = 50  # tokens
MIN_CHUNK_TOKENS = 50
BATCH_SIZE = 256    # embeddings per API call (max 2048 for this model)
MAX_RETRIES = 5


def chunk_text(text: str, enc, chunk_size: int, overlap: int, min_tokens: int) -> list[str]:
    """Split text into token-bounded chunks with overlap."""
    tokens = enc.encode(text)
    if len(tokens) < min_tokens:
        return []
    chunks = []
    start = 0
    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        if len(chunk_tokens) >= min_tokens:
            chunks.append(enc.decode(chunk_tokens))
        if end >= len(tokens):
            break
        start += chunk_size - overlap
    return chunks


def embed_batch(client: OpenAI, texts: list[str]) -> list[list[float]]:
    """Embed a batch of texts with retry on rate limit."""
    for attempt in range(MAX_RETRIES):
        try:
            resp = client.embeddings.create(model=EMBED_MODEL, input=texts)
            return [item.embedding for item in resp.data]
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                wait = 2 ** attempt
                print(f"\n  API error ({e}), retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise


def main():
    faiss_path = DATA_DIR / "faiss_index.bin"
    meta_path = DATA_DIR / "chunk_metadata.json"

    if faiss_path.exists() and meta_path.exists():
        print("FAISS index already exists — skipping index construction.")
        with open(meta_path) as f:
            chunks_meta = json.load(f)
        print(f"  Loaded {len(chunks_meta):,} chunks from disk.")
        return

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not set. Copy .env.example → .env and fill in your key.")
    client = OpenAI(api_key=api_key)

    print("Loading reviews and metadata...")
    with open(DATA_DIR / "item_reviews.json") as f:
        item_reviews: dict = json.load(f)
    meta = pd.read_parquet(DATA_DIR / "item_meta.parquet")
    title_map = dict(zip(meta["item_id"], meta["title"].fillna("")))

    enc = tiktoken.get_encoding("cl100k_base")

    # Build chunks
    print("\nChunking reviews...")
    all_chunks_text = []
    all_chunks_meta = []

    for item_id, reviews in tqdm(item_reviews.items(), desc="Chunking"):
        title = title_map.get(item_id, "")
        for review_text in reviews:
            if not isinstance(review_text, str) or not review_text.strip():
                continue
            chunks = chunk_text(review_text, enc, CHUNK_SIZE, CHUNK_OVERLAP, MIN_CHUNK_TOKENS)
            for ci, chunk in enumerate(chunks):
                all_chunks_text.append(chunk)
                all_chunks_meta.append({
                    "item_id": item_id,
                    "title": title,
                    "chunk_idx": ci,
                    "text": chunk,
                })

    print(f"  Total chunks: {len(all_chunks_text):,}")

    # Embed in batches
    print(f"\nEmbedding {len(all_chunks_text):,} chunks with {EMBED_MODEL}...")
    print(f"  Batch size: {BATCH_SIZE} | Estimated batches: {len(all_chunks_text)//BATCH_SIZE + 1}")

    all_embeddings = []
    for i in tqdm(range(0, len(all_chunks_text), BATCH_SIZE), desc="Embedding batches"):
        batch = all_chunks_text[i: i + BATCH_SIZE]
        embs = embed_batch(client, batch)
        all_embeddings.extend(embs)
        # Polite rate-limit backoff: ~150 req/min for embedding API
        if (i // BATCH_SIZE) % 10 == 9:
            time.sleep(0.5)

    vectors = np.array(all_embeddings, dtype=np.float32)
    print(f"  Embeddings shape: {vectors.shape}")

    # Build FAISS flat L2 index
    print("\nBuilding FAISS flat L2 index...")
    index = faiss.IndexFlatL2(EMBED_DIM)
    index.add(vectors)
    faiss.write_index(index, str(faiss_path))
    print(f"  Index size: {index.ntotal:,} vectors")
    print(f"  Saved → {faiss_path}")

    # Save chunk metadata
    with open(meta_path, "w") as f:
        json.dump(all_chunks_meta, f)
    print(f"  Saved → {meta_path}")

    print("\nRAG index construction complete.")


if __name__ == "__main__":
    main()
