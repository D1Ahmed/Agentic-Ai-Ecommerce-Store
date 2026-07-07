"""
Notification Service — Business logic for user notifications.
"""

from typing import List, Any
from db.client import get_db

async def get_user_notifications(user_id: int) -> List[Any]:
    """Get all notifications for a user, ordered by newest first."""
    async with get_db() as db:
        return await db.notification.find_many(
            where={"user_id": user_id},
            order={"created_at": "desc"}
        )

async def mark_notification_read(notification_id: int, user_id: int) -> Any:
    """Mark a notification as read, ensuring the user owns it."""
    async with get_db() as db:
        notif = await db.notification.find_unique(where={"id": notification_id})
        if not notif or notif.user_id != user_id:
            raise ValueError("Notification not found or access denied")
        
        return await db.notification.update(
            where={"id": notification_id},
            data={"is_read": True}
        )

async def create_notification(user_id: int, notif_type: str, title: str, message: str, link: str = None) -> Any:
    """Create a new notification for a user."""
    async with get_db() as db:
        return await db.notification.create(
            data={
                "user_id": user_id,
                "type": notif_type,
                "title": title,
                "message": message,
                "link": link
            }
        )
