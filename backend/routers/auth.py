from fastapi import APIRouter, Depends, Header, HTTPException

from core.deps import get_current_user
from core.deps import get_current_user
from models.schemas import AuthResponse, LoginRequest, RegisterRequest, UserResponse, GoogleLoginRequest, UpdateProfileRequest
from services.auth_service import login_user, logout_user, register_user, google_login_user, update_user_profile

router = APIRouter(prefix="/auth", tags=["Auth"])


def _user_response(user) -> UserResponse:
    return UserResponse(
        id=user.id, 
        name=user.name, 
        email=user.email, 
        address=user.address, 
        phone_number=user.phone_number
    )


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
    return AuthResponse(token=token, user=_user_response(user))


@router.post("/logout")
async def logout(authorization: str = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        if token:
            await logout_user(token)
    return {"status": "ok"}


@router.get("/me", response_model=UserResponse)
async def me(user=Depends(get_current_user)):
    return _user_response(user)


@router.post("/google", response_model=AuthResponse)
async def google_login(body: GoogleLoginRequest):
    try:
        user, token, _ = await google_login_user(body.credential)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    return AuthResponse(token=token, user=_user_response(user))


@router.put("/profile", response_model=UserResponse)
async def update_profile(body: UpdateProfileRequest, user=Depends(get_current_user)):
    updated_user = await update_user_profile(user.id, body.address, body.phone_number)
    return _user_response(updated_user)
