from typing import Any, List

from db.client import get_db


def _cart_item_payload(row: Any) -> dict:
    product = row.product
    stock = product.stock if product else 0
    quantity = row.quantity
    out_of_stock = stock <= 0
    insufficient_stock = not out_of_stock and quantity > stock

    return {
        "id": product.id,
        "name": product.name,
        "price": product.price,
        "min_price": product.min_price,
        "description": product.description,
        "detailed_description": product.detailed_description,
        "category": product.category,
        "sub_category": product.sub_category,
        "color": product.color,
        "gender": product.gender,
        "season": product.season,
        "image_url": product.image_url,
        "stock": stock,
        "rating": product.rating,
        "reviews_count": product.reviews_count,
        "quantity": quantity,
        "out_of_stock": out_of_stock,
        "insufficient_stock": insufficient_stock,
    }


async def get_user_cart(user_id: int) -> List[dict]:
    async with get_db() as db:
        rows = await db.usercartitem.find_many(
            where={"user_id": user_id},
            include={"product": True},
            order={"updated_at": "desc"},
        )
        return [_cart_item_payload(row) for row in rows if row.product]


async def sync_user_cart(user_id: int, items: List[dict]) -> List[dict]:
    """Replace the user's cart with the provided items.
    
    IMPORTANT: If items is empty, we do NOT wipe the cart.
    An empty sync is treated as a no-op to prevent accidental data loss
    from race conditions on the frontend.
    """
    if not items:
        # Never wipe the cart with an empty list — return current cart instead
        return await get_user_cart(user_id)

    async with get_db() as db:
        await db.usercartitem.delete_many(where={"user_id": user_id})

        merged_items = {}
        for item in items:
            product_id = int(item["product_id"])
            quantity = max(1, int(item.get("quantity", 1)))
            if product_id in merged_items:
                merged_items[product_id] += quantity
            else:
                merged_items[product_id] = quantity

        for product_id, quantity in merged_items.items():
            product = await db.product.find_unique(where={"id": product_id})
            if not product:
                continue
            await db.usercartitem.create(
                data={
                    "user_id": user_id,
                    "product_id": product_id,
                    "quantity": quantity,
                }
            )

    return await get_user_cart(user_id)


async def clear_user_cart(user_id: int) -> None:
    async with get_db() as db:
        await db.usercartitem.delete_many(where={"user_id": user_id})
