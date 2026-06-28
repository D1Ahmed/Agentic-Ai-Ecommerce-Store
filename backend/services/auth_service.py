import secrets
from datetime import datetime, timedelta, timezone

import bcrypt

from core.config import SESSION_EXPIRE_DAYS
from db.client import get_db


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


async def register_user(email: str, password: str, name: str):
    email = email.strip().lower()
    async with get_db() as db:
        existing = await db.user.find_unique(where={"email": email})
        if existing:
            raise ValueError("An account with this email already exists")

        user = await db.user.create(
            data={
                "email": email,
                "password_hash": hash_password(password),
                "name": name.strip(),
            }
        )
        token, expires_at = await _create_session(db, user.id)
        return user, token, expires_at


async def login_user(email: str, password: str):
    email = email.strip().lower()
    async with get_db() as db:
        user = await db.user.find_unique(where={"email": email})
        if not user or not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password")

        token, expires_at = await _create_session(db, user.id)
        return user, token, expires_at


async def logout_user(token: str) -> None:
    async with get_db() as db:
        await db.session.delete_many(where={"token": token})


async def get_user_by_token(token: str):
    async with get_db() as db:
        session = await db.session.find_unique(
            where={"token": token},
            include={"user": True},
        )
        if not session or not session.user:
            return None

        expires = session.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if expires < datetime.now(timezone.utc):
            await db.session.delete(where={"id": session.id})
            return None

        return session.user


async def _create_session(db, user_id: int) -> tuple[str, datetime]:
    token = secrets.token_urlsafe(48)
    expires_at = datetime.now(timezone.utc) + timedelta(days=SESSION_EXPIRE_DAYS)
    await db.session.create(
        data={
            "user_id": user_id,
            "token": token,
            "expires_at": expires_at,
        }
    )
    return token, expires_at
