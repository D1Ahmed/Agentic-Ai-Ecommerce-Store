from fastapi import APIRouter, Depends, HTTPException
from core.deps import get_current_user
from services.notification_service import get_user_notifications, mark_notification_read

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
async def list_notifications(user=Depends(get_current_user)):
    """Get all notifications for the current user."""
    notifs = await get_user_notifications(user.id)
    return [
        {
            "id": n.id,
            "type": n.type,
            "title": n.title,
            "message": n.message,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        }
        for n in notifs
    ]

@router.patch("/{notification_id}/read")
async def mark_read(notification_id: int, user=Depends(get_current_user)):
    """Mark a notification as read."""
    try:
        n = await mark_notification_read(notification_id, user.id)
        return {"status": "success", "id": n.id, "is_read": n.is_read}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
