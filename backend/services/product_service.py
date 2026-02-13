from prisma import Prisma

# This matches the 'search_products' tool we will tell Gemini about


async def search_products(query: str):
    db = Prisma()
    await db.connect()

    # Simple search in your products table
    products = await db.product.find_many(
        where={
            "OR": [
                {"name": {"contains": query, "mode": "insensitive"}},
                {"description": {"contains": query, "mode": "insensitive"}}
            ]
        }
    )

    await db.disconnect()
    return products


async def get_negotiated_price(product_id: int, user_offer: float, reason: str):
    db = Prisma()
    await db.connect()

    product = await db.product.find_unique(where={"id": product_id})
    await db.disconnect()

    if not product:
        return "Product not found."

    # Logic: If offer is above min_price, accept it.
    # If offer is too low, reject or counter-offer.
    if user_offer >= product.min_price:
        return f"Deal! I can give you the {product.name} for ${user_offer}. Use code: HAGGLE_DEAL"
    else:
        return f"I can't go that low. The best I can do is ${product.min_price + 5}."
