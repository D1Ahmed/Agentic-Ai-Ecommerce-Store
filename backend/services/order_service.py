from typing import List, Set, Optional

from models.schemas import OrderItem
from db.client import get_db
from services.cart_service import clear_user_cart


async def decrement_stock(
    items: List[OrderItem],
    user_id: Optional[int] = None,
    clear_cart: bool = True,
    city: str = "",
    province: str = ""
) -> None:
    """
    Validate stock, subtract ordered quantities, and optionally manage the cart.

    Args:
        items: The items to order.
        user_id: The authenticated user's ID.
        clear_cart: If True (default), wipes the entire cart after order.
                    If False, only removes the ordered items from the cart
                    (used for individual item purchases so the rest stays).
    """
    async with get_db() as db:
        total_amount = 0.0
        order_items_data = []
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

            total_amount += product.price * item.quantity
            order_items_data.append({
                "product_id": item.id,
                "quantity": item.quantity,
                "price": product.price,
                "selected_size": getattr(item, "selected_size", None),
                "selected_color": getattr(item, "selected_color", None)
            })

        for item in items:
            product = await db.product.find_unique(where={"id": item.id})
            if product:
                new_stock = max(0, product.stock - item.quantity)
                await db.product.update(
                    where={"id": item.id},
                    data={
                        "stock": new_stock,
                        "purchase_count": {"increment": item.quantity},
                    },
                )

    if user_id is not None:
        async with get_db() as db:
            await db.order.create(
                data={
                    "user_id": user_id,
                    "total": total_amount,
                    "status": "confirmed",
                    "city": city,
                    "province": province,
                    "items": {
                        "create": order_items_data
                    }
                }
            )

        if clear_cart:
            # Full checkout — wipe entire cart
            await clear_user_cart(user_id)
        else:
            # Individual/partial purchase — remove only the bought exact items
            async with get_db() as db:
                for item in items:
                    where_clause = {
                        "user_id": user_id,
                        "product_id": item.id,
                    }
                    if getattr(item, "selected_size", None):
                        where_clause["selected_size"] = item.selected_size
                    if getattr(item, "selected_color", None):
                        where_clause["selected_color"] = item.selected_color
                        
                    await db.usercartitem.delete_many(where=where_clause)

    try:
        from services.rag_service import refresh_index
        await refresh_index()
    except Exception as e:
        print(f"[ORDER] RAG refresh failed (non-critical): {e}")

