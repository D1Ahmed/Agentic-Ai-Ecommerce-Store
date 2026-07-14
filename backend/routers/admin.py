from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List, Any
from datetime import datetime, timedelta, timezone

from db.client import get_db
from core.deps import get_current_user
from models.schemas import UserResponse

router = APIRouter(prefix="/admin", tags=["admin"])

async def get_current_admin(user: Any = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.get("/analytics")
async def get_analytics(admin: Any = Depends(get_current_admin)):
    async with get_db() as db:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)

        total_visitors = await db.sitevisit.count()
        today_visitors = await db.sitevisit.count(where={"visited_at": {"gte": today_start}})
        week_visitors = await db.sitevisit.count(where={"visited_at": {"gte": week_start}})
        month_visitors = await db.sitevisit.count(where={"visited_at": {"gte": month_start}})

        return {
            "total_visitors": total_visitors,
            "today_visitors": today_visitors,
            "week_visitors": week_visitors,
            "month_visitors": month_visitors
        }

@router.get("/users", response_model=List[UserResponse])
async def get_users(admin: Any = Depends(get_current_admin)):
    async with get_db() as db:
        users = await db.user.find_many(
            order={"created_at": "desc"},
            include={"store": True}
        )
        return [
            UserResponse(
                id=u.id,
                name=u.name,
                email=u.email,
                role=u.role,
                address=u.address,
                phone_number=u.phone_number,
                has_store=True if u.store or u.role == "seller" else False,
            )
            for u in users
        ]

@router.delete("/users/{user_id}")
async def delete_user(user_id: int, admin: Any = Depends(get_current_admin)):
    async with get_db() as db:
        target_user = await db.user.find_unique(where={"id": user_id})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        if target_user.role == "admin":
            raise HTTPException(status_code=400, detail="Cannot delete an admin user")

        await db.user.delete(where={"id": user_id})
        return {"detail": "User deleted successfully"}

@router.delete("/reviews/{review_id}")
async def delete_review(review_id: int, admin: Any = Depends(get_current_admin)):
    async with get_db() as db:
        review = await db.review.find_unique(where={"id": review_id})
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        await db.review.delete(where={"id": review_id})
        return {"detail": "Review deleted"}

@router.delete("/questions/{question_id}")
async def delete_question(question_id: int, admin: Any = Depends(get_current_admin)):
    async with get_db() as db:
        question = await db.productquestion.find_unique(where={"id": question_id})
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        await db.productquestion.delete(where={"id": question_id})
        return {"detail": "Question deleted"}
