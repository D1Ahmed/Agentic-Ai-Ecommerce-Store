from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, Header, HTTPException

from db.client import get_db
from services.auth_service import get_user_by_token


async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    async with get_db() as db:
        session = await db.session.find_unique(
            where={"token": token},
            include={"user": True},
        )
        if not session or not session.user:
            raise HTTPException(status_code=401, detail="Invalid session")

        expires = session.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            await db.session.delete(where={"id": session.id})
            raise HTTPException(status_code=401, detail="Session expired")

        return session.user


async def get_optional_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        return None
    try:
        return await get_user_by_token(token)
    except Exception:
        return None
