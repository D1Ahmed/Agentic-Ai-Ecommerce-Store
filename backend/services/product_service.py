from typing import List
from db.client import get_db


async def get_all_products() -> List:
    """Return every product in the database."""
    async with get_db() as db:
        return await db.product.find_many()


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
                    {
                        "detailed_description": {
                            "contains": query,
                            "mode": "insensitive",
                        }
                    },
                ]
            }
        )
