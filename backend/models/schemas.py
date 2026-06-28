from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str


class AuthResponse(BaseModel):
    token: str
    user: UserResponse


# ── Cart ──────────────────────────────────────────────────────────────────────

class CartSyncItem(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)


class CartSyncRequest(BaseModel):
    items: List[CartSyncItem]


# ── Orders ────────────────────────────────────────────────────────────────────

class OrderItem(BaseModel):
    """A single line item in an order."""
    id: int
    quantity: int


class OrderRequest(BaseModel):
    """Request body for POST /orders/place-order."""
    items: List[OrderItem]


# ── Chat ──────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    """A single turn in a conversation (user or assistant)."""
    role: str          # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request body for POST /ai/chat."""
    user_message: str
    history: Optional[List[ChatMessage]] = []
    user_name: Optional[str] = None


class ChatResponse(BaseModel):
    """Response body from POST /ai/chat."""
    text: str
    action: str
    debug_model: str
