from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional



class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    address: Optional[str] = None
    phone_number: Optional[str] = None
    role: str = "customer"
    has_store: bool = False

class GoogleLoginRequest(BaseModel):
    credential: str

class UpdateProfileRequest(BaseModel):
    address: Optional[str] = None
    phone_number: Optional[str] = None


class AuthResponse(BaseModel):
    token: str
    user: UserResponse



class CartSyncItem(BaseModel):
    product_id: int
    quantity: int = Field(ge=1)
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None


class CartSyncRequest(BaseModel):
    items: List[CartSyncItem]



class OrderItem(BaseModel):
    """A single line item in an order."""
    id: int
    quantity: int
    selected_size: Optional[str] = None
    selected_color: Optional[str] = None


class OrderRequest(BaseModel):
    """Request body for POST /orders/place-order."""
    items: List[OrderItem]
    city: Optional[str] = ""
    province: Optional[str] = ""



class ChatMessage(BaseModel):
    """A single turn in a conversation (user or assistant)."""
    role: str          # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    """Request body for POST /ai/chat."""
    user_message: str
    history: Optional[List[ChatMessage]] = None
    user_name: Optional[str] = None
    current_path: Optional[str] = None
    has_store: Optional[bool] = False
    is_authenticated: Optional[bool] = False
    store_collections: Optional[List[str]] = None
    image_data: Optional[List[str]] = None


class ChatResponse(BaseModel):
    """Response body from POST /ai/chat."""
    text: str
    action: str
    debug_model: str



class StoreRegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    address: str = Field(min_length=5, max_length=300)
    phone: str = Field(min_length=7, max_length=20)
    categories: List[str] = Field(min_length=1)
    description: Optional[str] = None


class StoreUpdateRequest(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    categories: Optional[List[str]] = None
    description: Optional[str] = None


class StoreResponse(BaseModel):
    id: int
    owner_id: int
    name: str
    address: str
    phone: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    categories: List[str] = []
    is_active: bool = True



class CollectionCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: Optional[str] = None


class CollectionResponse(BaseModel):
    id: int
    store_id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = "folder"
    product_count: int = 0



class SellerProductCreate(BaseModel):
    """All the product metadata (images sent separately as multipart)."""
    name: str = Field(min_length=2, max_length=200)
    description: str = Field(min_length=20)
    detailed_description: str = Field(min_length=50)
    price: float = Field(gt=0)
    min_price: float = Field(gt=0)
    category: str
    sub_category: str
    color: str
    gender: str               # "Men" | "Women" | "Unisex"
    season: str               # "Summer" | "Winter" | "All Season"
    collection_id: int
    is_negotiable: bool = True
    material: Optional[str] = None
    style: Optional[str] = None
    occasion: Optional[str] = None
    size_options: Optional[str] = None   # JSON array as string
    color_options: Optional[str] = None  # JSON array as string
    stock: int = Field(default=10, ge=0)


class SellerProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    detailed_description: Optional[str] = None
    price: Optional[float] = None
    min_price: Optional[float] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    color: Optional[str] = None
    gender: Optional[str] = None
    season: Optional[str] = None
    collection_id: Optional[int] = None
    is_negotiable: Optional[bool] = None
    material: Optional[str] = None
    style: Optional[str] = None
    occasion: Optional[str] = None
    size_options: Optional[str] = None
    color_options: Optional[str] = None
    stock: Optional[int] = None


class ProductSaleToggle(BaseModel):
    is_on_sale: bool
    sale_percentage: int = Field(default=0, ge=0, le=90)



class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: Optional[str] = None
    body: str = Field(min_length=5)


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    user_name: str = ""
    rating: int
    title: Optional[str] = None
    body: str
    reply: Optional[str] = None
    is_deleted: bool = False
    created_at: str

class ReplyRequest(BaseModel):
    reply: str = Field(min_length=2)



class QuestionCreate(BaseModel):
    question: str = Field(min_length=5)


class AnswerRequest(BaseModel):
    answer: str = Field(min_length=2)


class QuestionResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    user_name: str = ""
    question: str
    answer: Optional[str] = None
    answered_at: Optional[str] = None
    created_at: str
