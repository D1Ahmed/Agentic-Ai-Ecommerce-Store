from fastapi import APIRouter, Depends, HTTPException, Query

from core.deps import get_current_user
from models.schemas import OrderRequest
from services.order_service import decrement_stock

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/place-order")
async def place_order(
    order: OrderRequest,
    user=Depends(get_current_user),
    partial: bool = Query(False, description="If True, only remove ordered items from cart, not the entire cart"),
):
    """
    Decrements stock for each item in the order. Requires authentication.
    Use ?partial=true for individual item purchases to preserve the rest of the cart.
    """
    if not order.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    try:
        await decrement_stock(order.items, user_id=user.id, clear_cart=not partial, city=order.city, province=order.province)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"status": "success", "message": "Order placed successfully"}

