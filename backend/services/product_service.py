from typing import Any, List, Optional
from db.client import get_db


async def get_all_products() -> List:
    """Return every product in the database."""
    async with get_db() as db:
        return await db.product.find_many(
            include={"images": True, "store": True},
            order={"created_at": "desc"},
        )


async def get_product_by_id(product_id: int) -> Any | None:
    """Return a single product with full relations."""
    async with get_db() as db:
        return await db.product.find_unique(
            where={"id": product_id},
            include={
                "images": True,
                "store": True,
                "collection": True,
            },
        )


async def get_popular_products(limit: int = 50) -> List:
    """Return products sorted by popularity score (rating * reviews + purchases + views)."""
    async with get_db() as db:
        # Prisma doesn't support computed ordering, so we fetch and sort in Python
        products = await db.product.find_many(
            include={"images": True, "store": True},
        )
        # Popularity score: weighted combination
        def popularity(p):
            return (p.rating * p.reviews_count * 2) + (p.purchase_count * 3) + (p.view_count * 0.1)

        products.sort(key=popularity, reverse=True)
        return products[:limit]


async def search_products(query: str) -> List:
    """
    Full-text search across the most relevant product fields.
    Returns an empty list when the query is blank.
    """
    if not query.strip():
        return []

    async with get_db() as db:
        return await db.product.find_many(
            where={
                "OR": [
                    {"name": {"contains": query, "mode": "insensitive"}},
                    {"description": {"contains": query, "mode": "insensitive"}},
                    {"category": {"contains": query, "mode": "insensitive"}},
                    {"color": {"contains": query, "mode": "insensitive"}},
                    {"sub_category": {"contains": query, "mode": "insensitive"}},
                    {"season": {"contains": query, "mode": "insensitive"}},
                    {"gender": {"contains": query, "mode": "insensitive"}},
                    {"material": {"contains": query, "mode": "insensitive"}},
                    {"style": {"contains": query, "mode": "insensitive"}},
                    {"occasion": {"contains": query, "mode": "insensitive"}},
                    {
                        "detailed_description": {
                            "contains": query,
                            "mode": "insensitive",
                        }
                    },
                ]
            },
            include={"images": True, "store": True},
        )
