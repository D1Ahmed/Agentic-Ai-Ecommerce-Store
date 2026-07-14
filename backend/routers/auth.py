from fastapi import APIRouter, Depends, Header, HTTPException

from core.deps import get_current_user
from models.schemas import AuthResponse, LoginRequest, RegisterRequest, UserResponse, GoogleLoginRequest, UpdateProfileRequest
from services.auth_service import login_user, logout_user, register_user, google_login_user, update_user_profile

router = APIRouter(prefix="/auth", tags=["Auth"])


def _user_response(user, has_store: bool = False) -> UserResponse:
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        address=user.address,
        phone_number=user.phone_number,
        role=getattr(user, "role", "customer"),
        has_store=has_store,
        last_active=getattr(user, "last_active", None),
    )


async def _check_has_store(user_id: int) -> bool:
    from db.client import get_db
    async with get_db() as db:
        store = await db.store.find_unique(where={"owner_id": user_id})
        return store is not None


@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    try:
        user, token, _ = await register_user(body.email, body.password, body.name)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return AuthResponse(token=token, user=_user_response(user))


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    try:
        user, token, _ = await login_user(body.email, body.password)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    has_store = await _check_has_store(user.id)
    return AuthResponse(token=token, user=_user_response(user, has_store=has_store))


@router.post("/logout")
async def logout(authorization: str = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        if token:
            await logout_user(token)
    return {"status": "ok"}


@router.get("/me", response_model=UserResponse)
async def me(user=Depends(get_current_user)):
    from db.client import get_db
    from datetime import datetime, timezone
    async with get_db() as db:
        user = await db.user.update(
            where={"id": user.id},
            data={"last_active": datetime.now(timezone.utc)}
        )
    has_store = await _check_has_store(user.id)
    return _user_response(user, has_store=has_store)


@router.post("/google", response_model=AuthResponse)
async def google_login(body: GoogleLoginRequest):
    try:
        user, token, _ = await google_login_user(body.credential)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    has_store = await _check_has_store(user.id)
    return AuthResponse(token=token, user=_user_response(user, has_store=has_store))


@router.put("/profile", response_model=UserResponse)
async def update_profile(body: UpdateProfileRequest, user=Depends(get_current_user)):
    updated_user = await update_user_profile(user.id, body.address, body.phone_number)
    has_store = await _check_has_store(updated_user.id)
    return _user_response(updated_user, has_store=has_store)
