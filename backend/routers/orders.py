from fastapi import APIRouter, Depends, HTTPException

from core.deps import get_current_user
from models.schemas import OrderRequest
from services.order_service import decrement_stock

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/place-order")
async def place_order(order: OrderRequest, user=Depends(get_current_user)):
    """
    Decrements stock for each item in the order. Requires authentication.
    """
    if not order.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    try:
        await decrement_stock(order.items, user_id=user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"status": "success", "message": "Order placed successfully"}
