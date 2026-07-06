"""
Review Service — Business logic for product reviews and Q&A.
"""

from __future__ import annotations

from typing import Any, List

from db.client import get_db


async def has_purchased_product(user_id: int, product_id: int) -> bool:
    """Check if a user has a confirmed order containing this product."""
    async with get_db() as db:
        order_item = await db.orderitem.find_first(
            where={
                "product_id": product_id,
                "order": {
                    "user_id": user_id,
                    "status": {"in": ["confirmed", "delivered", "completed"]},
                },
            }
        )
        return order_item is not None


async def create_review(
    product_id: int, user_id: int, rating: int, body: str, title: str | None = None
) -> Any:
    """Create a review — only allowed if the user has purchased the product."""
    if not await has_purchased_product(user_id, product_id):
        raise ValueError("You can only review products you have purchased")

    async with get_db() as db:
        # Check for existing review
        existing = await db.review.find_first(
            where={"product_id": product_id, "user_id": user_id}
        )
        if existing:
            raise ValueError("You have already reviewed this product")

        review = await db.review.create(
            data={
                "product_id": product_id,
                "user_id": user_id,
                "rating": rating,
                "title": title,
                "body": body,
            }
        )

        # Recalculate product rating
        all_reviews = await db.review.find_many(where={"product_id": product_id})
        if all_reviews:
            avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews)
            await db.product.update(
                where={"id": product_id},
                data={
                    "rating": round(avg_rating, 1),
                    "reviews_count": len(all_reviews),
                },
            )

        return review


async def get_product_reviews(product_id: int) -> List[Any]:
    async with get_db() as db:
        reviews = await db.review.find_many(
            where={"product_id": product_id},
            include={"user": True},
            order={"created_at": "desc"},
        )
        return reviews


async def create_question(product_id: int, user_id: int, question: str) -> Any:
    async with get_db() as db:
        return await db.productquestion.create(
            data={
                "product_id": product_id,
                "user_id": user_id,
                "question": question,
            }
        )


async def get_product_questions(product_id: int) -> List[Any]:
    async with get_db() as db:
        return await db.productquestion.find_many(
            where={"product_id": product_id},
            include={"user": True},
            order={"created_at": "desc"},
        )


async def increment_view_count(product_id: int) -> None:
    """Increment view count for a product (fire-and-forget)."""
    try:
        async with get_db() as db:
            await db.product.update(
                where={"id": product_id},
                data={"view_count": {"increment": 1}},
            )
    except Exception:
        pass  # Non-critical
