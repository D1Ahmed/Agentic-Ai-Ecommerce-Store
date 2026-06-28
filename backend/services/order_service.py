from typing import List

from models.schemas import OrderItem
from db.client import get_db
from services.cart_service import clear_user_cart


async def decrement_stock(items: List[OrderItem], user_id: int | None = None) -> None:
    """
    Validate stock, subtract ordered quantities, and clear the user's cart.
    """
    async with get_db() as db:
        for item in items:
            product = await db.product.find_unique(where={"id": item.id})
            if not product:
                raise ValueError(f"Product {item.id} not found")
            if product.stock <= 0:
                raise ValueError(f"{product.name} is out of stock")
            if item.quantity > product.stock:
                raise ValueError(
                    f"Only {product.stock} units of {product.name} available"
                )

        for item in items:
            product = await db.product.find_unique(where={"id": item.id})
            if product:
                new_stock = max(0, product.stock - item.quantity)
                await db.product.update(
                    where={"id": item.id},
                    data={"stock": new_stock},
                )

    if user_id is not None:
        await clear_user_cart(user_id)

    try:
        from services.rag_service import refresh_index
        await refresh_index()
    except Exception as e:
        print(f"[ORDER] RAG refresh failed (non-critical): {e}")
