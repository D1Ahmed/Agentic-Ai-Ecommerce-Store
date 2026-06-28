"""
RAG Service — Hybrid product retrieval for The Clerk AI.

Retrieval strategy (fast path always available):
  1. init_catalog()   → load all products from DB (instant, no API)
  2. retrieve(query)  → structured filter + keyword scoring (works offline)
  3. build_index()    → optional FAISS semantic index (background, best-effort)

Semantic embedding providers (tried in order):
  Cohere → Gemini → skip (keyword retrieval still works)
"""

from __future__ import annotations

import asyncio
import pickle
import re
from pathlib import Path
from typing import Any, List

import httpx
import numpy as np

try:
    import faiss
except ImportError:  # pragma: no cover
    faiss = None  # type: ignore

from core.config import (
    COHERE_API_KEY,
    EMBED_MODEL,
    GEMINI_API_KEY,
    RAG_TOP_K,
)
from services.product_service import get_all_products

# ── Globals ───────────────────────────────────────────────────────────────────
_index: Any = None
_products: List[Any] = []
_is_building = False
_catalog_ready = False

_CACHE_DIR = Path(__file__).resolve().parent.parent / ".rag_cache"
_CACHE_FILE = _CACHE_DIR / "faiss_index.pkl"


# ── Catalog bootstrap ─────────────────────────────────────────────────────────

async def init_catalog() -> None:
    """Load products from DB so chat works immediately without embeddings."""
    global _products, _catalog_ready
    products = await get_all_products()
    _products = list(products)
    _catalog_ready = len(_products) > 0
    print(f"[RAG] Catalog ready: {len(_products)} products")


def is_ready() -> bool:
    """True once the product catalog is loaded (does not require FAISS)."""
    return _catalog_ready and bool(_products)


def semantic_ready() -> bool:
    return _index is not None


# ── Query intent parsing ──────────────────────────────────────────────────────

def _parse_price(value: str, context: str) -> float:
    num = float(value)
    window = context.lower()
    if num <= 30 or "k" in window:
        return num * 1000
    return num


def _parse_query_intent(query: str) -> dict:
    q = query.lower()

    intent: dict = {
        "gender": None,
        "season": None,
        "sub_category": None,
        "max_price": None,
        "min_price": None,
        "browse_all": False,
    }

    if any(w in q for w in ("women", "woman", "ladies", "female", "girls", "her")):
        intent["gender"] = "Women"
    elif any(w in q for w in ("men", "man", "male", "guys", "boys", "him")):
        intent["gender"] = "Men"

    if "winter" in q:
        intent["season"] = "Winter"
    elif "summer" in q:
        intent["season"] = "Summer"

    if any(w in q for w in ("shoe", "shoes", "sandal", "heel", "heels", "sneaker", "footwear")):
        intent["sub_category"] = "Shoes"
    elif any(
        w in q
        for w in (
            "cloth", "clothes", "clothing", "shirt", "tee", "t-shirt",
            "jacket", "pant", "pants", "short", "shorts", "dress", "outfit", "wear",
        )
    ):
        intent["sub_category"] = "Clothes"

    for pattern in (
        r"(?:under|below|less than|<|max|upto|up to)\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*k?\b",
        r"(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*k?\s*(?:or less|and under|max)",
    ):
        match = re.search(pattern, q)
        if match:
            intent["max_price"] = _parse_price(match.group(1), match.group(0))
            break

    for pattern in (
        r"(?:over|above|more than|>|min|at least)\s*(?:rs\.?\s*)?(\d+(?:\.\d+)?)\s*k?\b",
    ):
        match = re.search(pattern, q)
        if match:
            intent["min_price"] = _parse_price(match.group(1), match.group(0))
            break

    if any(w in q for w in ("show", "find", "browse", "see", "list", "display", "all")):
        intent["browse_all"] = True

    return intent


def _product_to_document(p: Any) -> str:
    parts = [
        p.name,
        p.category or "",
        p.sub_category or "",
        p.gender or "",
        p.season or "",
        p.color or "",
        f"Rs {p.price}",
        p.description or "",
        p.detailed_description or "",
    ]
    return " | ".join(part for part in parts if part)


def _matches_filters(p: Any, intent: dict) -> bool:
    if intent["gender"] and (p.gender or "").lower() != intent["gender"].lower():
        return False
    if intent["season"] and (p.season or "").lower() != intent["season"].lower():
        return False
    if intent["sub_category"] and (p.sub_category or "").lower() != intent["sub_category"].lower():
        return False
    if intent["max_price"] is not None and p.price > intent["max_price"]:
        return False
    if intent["min_price"] is not None and p.price < intent["min_price"]:
        return False
    return True


def _keyword_score(p: Any, query: str) -> float:
    blob = _product_to_document(p).lower()
    tokens = [t for t in re.findall(r"[a-z0-9]+", query.lower()) if len(t) > 2]
    if not tokens:
        return 0.0
    score = 0.0
    for token in tokens:
        if token in blob:
            score += 2.0 if token in (p.name or "").lower() else 1.0
    return score


def _keyword_retrieve(query: str, top_k: int) -> List[Any]:
    """Structured + keyword retrieval — no external API required."""
    if not _products:
        return []

    intent = _parse_query_intent(query)
    has_filters = any(
        intent[k] is not None
        for k in ("gender", "season", "sub_category", "max_price", "min_price")
    )

    scored: List[tuple[float, Any]] = []
    for product in _products:
        if has_filters and not _matches_filters(product, intent):
            continue
        score = _keyword_score(product, query)
        if has_filters or score > 0:
            scored.append((score, product))

    scored.sort(key=lambda item: item[0], reverse=True)

    if intent["browse_all"] and has_filters:
        return [p for _, p in scored[:50]]

    if scored:
        return [p for _, p in scored[:top_k]]

    if has_filters:
        return []

    # Last resort: return a slice of the catalogue
    return list(_products[:top_k])


# ── Embedding providers ───────────────────────────────────────────────────────

def _normalise(vecs: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    return vecs / norms


def _embed_with_cohere(texts: List[str], input_type: str) -> np.ndarray | None:
    if not COHERE_API_KEY:
        return None
    try:
        response = httpx.post(
            "https://api.cohere.com/v1/embed",
            headers={"Authorization": f"Bearer {COHERE_API_KEY}"},
            json={
                "texts": texts,
                "model": "embed-english-v3.0",
                "input_type": input_type,
            },
            timeout=30.0,
        )
        if response.status_code == 429:
            return None
        response.raise_for_status()
        embeddings = response.json()["embeddings"]
        return _normalise(np.array(embeddings, dtype=np.float32))
    except Exception as exc:
        print(f"[RAG] Cohere embed failed: {exc}")
        return None


def _embed_with_gemini(texts: List[str]) -> np.ndarray | None:
    if not GEMINI_API_KEY:
        return None
    try:
        import google.genai as genai

        client = genai.Client(api_key=GEMINI_API_KEY)
        result = client.models.embed_content(model=EMBED_MODEL, contents=texts)
        vecs = np.array([entry.values for entry in result.embeddings], dtype=np.float32)
        return _normalise(vecs)
    except Exception as exc:
        err = str(exc)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            print(f"[RAG] Gemini rate limited: {exc}")
        else:
            print(f"[RAG] Gemini embed failed: {exc}")
        return None


async def _embed_batch(texts: List[str], *, query: bool = False) -> np.ndarray | None:
    input_type = "search_query" if query else "search_document"
    vecs = _embed_with_cohere(texts, input_type)
    if vecs is not None:
        return vecs
    return _embed_with_gemini(texts)


def _save_cache(matrix: np.ndarray, product_ids: List[int]) -> None:
    try:
        _CACHE_DIR.mkdir(parents=True, exist_ok=True)
        with _CACHE_FILE.open("wb") as handle:
            pickle.dump({"matrix": matrix, "product_ids": product_ids}, handle)
        print(f"[RAG] Cached semantic index ({len(product_ids)} products)")
    except Exception as exc:
        print(f"[RAG] Cache save failed: {exc}")


def _load_cache() -> bool:
    global _index, _products

    if faiss is None or not _CACHE_FILE.exists() or not _products:
        return False

    try:
        with _CACHE_FILE.open("rb") as handle:
            payload = pickle.load(handle)

        id_to_product = {p.id: p for p in _products}
        ordered_products = []
        rows = []
        for product_id, row in zip(payload["product_ids"], payload["matrix"]):
            product = id_to_product.get(product_id)
            if product is not None:
                ordered_products.append(product)
                rows.append(row)

        if not rows:
            return False

        matrix = np.vstack(rows).astype(np.float32)
        dim = matrix.shape[1]
        idx = faiss.IndexFlatIP(dim)
        idx.add(matrix)
        _index = idx
        _products = ordered_products
        print(f"[RAG] Loaded cached semantic index ({len(_products)} products)")
        return True
    except Exception as exc:
        print(f"[RAG] Cache load failed: {exc}")
        return False


async def build_index() -> None:
    """Build FAISS index in the background. Chat works without this."""
    global _index, _is_building

    if _is_building or faiss is None:
        if faiss is None:
            print("[RAG] FAISS not installed — using keyword retrieval only.")
        return

    if _index is not None:
        return

    if not _products:
        await init_catalog()

    if _load_cache():
        return

    _is_building = True
    try:
        print("[RAG] Building semantic index (background)...")
        docs = [_product_to_document(p) for p in _products]
        all_vecs: List[np.ndarray] = []
        batch_size = 5

        for start in range(0, len(docs), batch_size):
            batch = docs[start : start + batch_size]
            vecs = None
            for attempt in range(3):
                vecs = await _embed_batch(batch)
                if vecs is not None:
                    all_vecs.append(vecs)
                    break
                wait = 15 * (attempt + 1)
                print(f"[RAG] Embed retry {attempt + 1}/3 in {wait}s...")
                await asyncio.sleep(wait)
            else:
                print(f"[RAG] Batch {start // batch_size} skipped — keyword retrieval remains active.")
                return

            if start + batch_size < len(docs):
                await asyncio.sleep(2)

        if not all_vecs:
            print("[RAG] No embeddings generated — keyword retrieval active.")
            return

        matrix = np.vstack(all_vecs)
        dim = matrix.shape[1]
        idx = faiss.IndexFlatIP(dim)
        idx.add(matrix)
        _index = idx
        _save_cache(matrix, [p.id for p in _products])
        print(f"[RAG] Semantic index ready: {len(_products)} products, dim={dim}")

    finally:
        _is_building = False


async def refresh_index() -> None:
    """Reload catalogue after stock changes; rebuild embeddings in background."""
    global _index
    _index = None
    if _CACHE_FILE.exists():
        try:
            _CACHE_FILE.unlink()
        except OSError:
            pass
    await init_catalog()
    asyncio.create_task(build_index())


def _semantic_retrieve(query: str, top_k: int) -> List[Any]:
    if _index is None or not _products:
        return []

    qvec = None
    for provider in ("cohere", "gemini"):
        if provider == "cohere":
            qvec = _embed_with_cohere([query], "search_query")
        else:
            qvec = _embed_with_gemini([query])
        if qvec is not None:
            break

    if qvec is None:
        raise RuntimeError("Query embedding unavailable")

    scores, indices = _index.search(qvec, min(top_k, len(_products)))
    return [_products[i] for i in indices[0] if 0 <= i < len(_products)]


async def retrieve(query: str, top_k: int = RAG_TOP_K) -> List[Any]:
    """
    Return the most relevant products for a user query.
    Uses semantic search when available, otherwise smart keyword/filter search.
    """
    if not _products:
        await init_catalog()

    intent = _parse_query_intent(query)
    limit = 50 if intent["browse_all"] else top_k

    if _index is not None:
        try:
            semantic = _semantic_retrieve(query, limit)
            if semantic:
                return semantic
        except Exception as exc:
            print(f"[RAG] Semantic retrieve fallback: {exc}")

    return _keyword_retrieve(query, limit)
