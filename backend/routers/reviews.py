"""
Reviews & Q&A Router — product reviews (purchase-gated) and customer questions.
"""

from fastapi import APIRouter, Depends, HTTPException

from core.deps import get_current_user, get_optional_user
from models.schemas import ReviewCreate, QuestionCreate
from services.review_service import (
    create_review,
    get_product_reviews,
    has_purchased_product,
    create_question,
    get_product_questions,
    increment_view_count,
)

router = APIRouter(prefix="/products", tags=["Reviews & Q&A"])


# ── Reviews ───────────────────────────────────────────────────────────────────

@router.post("/{product_id}/reviews")
async def post_review(product_id: int, body: ReviewCreate, user=Depends(get_current_user)):
    """Post a review — only allowed if the user has purchased the product."""
    try:
        review = await create_review(
            product_id=product_id,
            user_id=user.id,
            rating=body.rating,
            body=body.body,
            title=body.title,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "id": review.id,
        "product_id": review.product_id,
        "rating": review.rating,
        "title": review.title,
        "body": review.body,
        "created_at": review.created_at.isoformat(),
    }


@router.get("/{product_id}/reviews")
async def list_reviews(product_id: int):
    """Get all reviews for a product (public)."""
    reviews = await get_product_reviews(product_id)
    return [
        {
            "id": r.id,
            "product_id": r.product_id,
            "user_id": r.user_id,
            "user_name": r.user.name if r.user else "Anonymous",
            "rating": r.rating,
            "title": r.title,
            "body": r.body,
            "created_at": r.created_at.isoformat(),
        }
        for r in reviews
    ]


@router.get("/{product_id}/can-review")
async def check_can_review(product_id: int, user=Depends(get_current_user)):
    """Check if the current user can review this product."""
    can = await has_purchased_product(user.id, product_id)
    return {"can_review": can}


# ── Q&A ───────────────────────────────────────────────────────────────────────

@router.post("/{product_id}/questions")
async def ask_question(product_id: int, body: QuestionCreate, user=Depends(get_current_user)):
    """Ask a question about a product (any authenticated user)."""
    question = await create_question(product_id, user.id, body.question)
    return {
        "id": question.id,
        "product_id": question.product_id,
        "question": question.question,
        "created_at": question.created_at.isoformat(),
    }


@router.get("/{product_id}/questions")
async def list_questions(product_id: int):
    """Get all Q&A for a product (public)."""
    questions = await get_product_questions(product_id)
    return [
        {
            "id": q.id,
            "product_id": q.product_id,
            "user_id": q.user_id,
            "user_name": q.user.name if q.user else "Anonymous",
            "question": q.question,
            "answer": q.answer,
            "answered_at": q.answered_at.isoformat() if q.answered_at else None,
            "created_at": q.created_at.isoformat(),
        }
        for q in questions
    ]


# ── View Tracking ─────────────────────────────────────────────────────────────

@router.post("/{product_id}/view")
async def track_view(product_id: int):
    """Increment view count (fire-and-forget, no auth required)."""
    await increment_view_count(product_id)
    return {"status": "ok"}
