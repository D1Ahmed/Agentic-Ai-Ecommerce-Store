import secrets
from datetime import datetime, timedelta, timezone

import bcrypt

from core.config import SESSION_EXPIRE_DAYS
from db.client import get_db
import os
from google.oauth2 import id_token
from google.auth.transport import requests


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


async def google_login_user(credential: str):
    client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()
    if not client_id:
        raise ValueError("Google Client ID not configured")

    idinfo = None

    # Primary: verify via google-auth library
    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            requests.Request(),
            client_id,
        )
    except Exception as primary_err:
        print(f"[GOOGLE AUTH] Primary verification failed: {primary_err}")

        # Fallback: verify via Google's tokeninfo endpoint
        import httpx as _httpx
        try:
            resp = _httpx.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": credential},
                timeout=10,
            )
            if resp.status_code != 200:
                print(f"[GOOGLE AUTH] Fallback failed with status {resp.status_code}: {resp.text}")
                raise ValueError("Invalid Google token — verification failed")

            data = resp.json()
            # Validate audience
            if data.get("aud") != client_id and data.get("azp") != client_id:
                print(f"[GOOGLE AUTH] Audience mismatch: got {data.get('aud')}, expected {client_id}")
                raise ValueError("Invalid Google token — wrong audience")

            idinfo = data
            print("[GOOGLE AUTH] Fallback verification succeeded")
        except ValueError:
            raise
        except Exception as fallback_err:
            print(f"[GOOGLE AUTH] Fallback verification also failed: {fallback_err}")
            raise ValueError("Invalid Google token — could not verify with Google")


    email = (idinfo.get("email") or "").strip().lower()
    name = idinfo.get("name") or email.split("@")[0]
    google_id = idinfo.get("sub")

    if not email:
        raise ValueError("Google account has no email address")

    async with get_db() as db:
        user = await db.user.find_unique(where={"email": email})

        if user:
            # Update google_id if not present
            if not user.google_id:
                user = await db.user.update(
                    where={"email": email},
                    data={"google_id": google_id}
                )
        else:
            # Create new user
            user = await db.user.create(
                data={
                    "email": email,
                    "password_hash": hash_password(secrets.token_urlsafe(32)),
                    "name": name,
                    "google_id": google_id,
                }
            )

        token, expires_at = await _create_session(db, user.id)
        return user, token, expires_at



async def update_user_profile(user_id: int, address: str | None, phone_number: str | None):
    async with get_db() as db:
        data = {}
        if address is not None:
            data["address"] = address
        if phone_number is not None:
            data["phone_number"] = phone_number
        
        if not data:
            return await db.user.find_unique(where={"id": user_id})

        return await db.user.update(
            where={"id": user_id},
            data=data
        )
