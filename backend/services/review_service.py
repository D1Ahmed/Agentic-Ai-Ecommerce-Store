"""
Review Service — Business logic for product reviews and Q&A.
"""

from __future__ import annotations

from typing import Any, List

from db.client import get_db
from services.notification_service import create_notification


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

        # Notify seller
        product = await db.product.find_unique(where={"id": product_id}, include={"store": True})
        if product and product.store:
            seller_id = product.store.owner_id
            await create_notification(
                user_id=seller_id,
                notif_type="new_review",
                title=f"New review on {product.name}",
                message=f"A customer gave a {rating}-star review.",
                link=f"/seller/products/manage/{product_id}"
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
        question_record = await db.productquestion.create(
            data={
                "product_id": product_id,
                "user_id": user_id,
                "question": question,
            }
        )

        product = await db.product.find_unique(where={"id": product_id}, include={"store": True})
        if product and product.store:
            seller_id = product.store.owner_id
            await create_notification(
                user_id=seller_id,
                notif_type="new_question",
                title=f"New question on {product.name}",
                message="A customer asked a question about this product.",
                link=f"/seller/products/manage/{product_id}"
            )

        return question_record


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
