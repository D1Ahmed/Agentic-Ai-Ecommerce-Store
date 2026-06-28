from fastapi import APIRouter, Depends

from core.deps import get_current_user
from models.schemas import CartSyncRequest
from services.cart_service import get_user_cart, sync_user_cart

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("")
async def get_cart(user=Depends(get_current_user)):
    return await get_user_cart(user.id)


@router.put("/sync")
async def sync_cart(body: CartSyncRequest, user=Depends(get_current_user)):
    items = [{"product_id": i.product_id, "quantity": i.quantity} for i in body.items]
    return await sync_user_cart(user.id, items)
