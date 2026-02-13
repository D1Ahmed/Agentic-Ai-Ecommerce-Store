import asyncio
from prisma import Prisma
from dotenv import load_dotenv

load_dotenv()


async def seed_products():
    db = Prisma()
    print("Connecting to database...")
    await db.connect()

    # 1. Clear old data to prevent duplicates
    print("Clearing old inventory...")
    await db.product.delete_many()

    # 2. Products with REAL Unsplash images so your store looks Pro immediately
    products = [
        # --- WINTER (EXTREME & MILD) ---
        {
            "name": "Arctic Expedition Parka",
            "price": 120.0, "min_price": 90.0,
            "category": "Winter",
            "description": "Extreme cold weather coat with faux fur hood. Rated for -10°C.",
            "image_url": "https://images.unsplash.com/photo-1539533727851-6a407402636a?w=500"
        },
        {
            "name": "Wool Trench Coat",
            "price": 95.0, "min_price": 75.0,
            "category": "Winter",
            "description": "Elegant mild winter coat. Perfect for chilly city evenings (10°C-15°C).",
            "image_url": "https://images.unsplash.com/photo-1544923246-77a07d6452bd?w=500"
        },
        {
            "name": "Nordic Knit Sweater",
            "price": 45.0, "min_price": 35.0,
            "category": "Winter",
            "description": "Thick wool sweater. Cozy layering for snowy days.",
            "image_url": "https://images.unsplash.com/photo-1624456722307-e24c43a42918?w=500"
        },
        {
            "name": "Tech Fleece Joggers",
            "price": 50.0, "min_price": 40.0,
            "category": "Winter",
            "description": "Insulated joggers for cold morning runs.",
            "image_url": "https://images.unsplash.com/photo-1552346154-21d32810aba3?w=500"
        },

        # --- SUMMER (HOT & HUMID) ---
        {
            "name": "Linen Breeze Shirt",
            "price": 40.0, "min_price": 30.0,
            "category": "Summer",
            "description": "100% pure white linen. Breathable fabric for hot 35°C+ days.",
            "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500"
        },
        {
            "name": "Floral Sundress",
            "price": 55.0, "min_price": 40.0,
            "category": "Summer",
            "description": "Lightweight floral dress, perfect for beach trips and sunny weather.",
            "image_url": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500"
        },
        {
            "name": "Retro Sunglasses",
            "price": 25.0, "min_price": 15.0,
            "category": "Accessories",
            "description": "UV protection sunglasses. Essential for summer days.",
            "image_url": "https://images.unsplash.com/photo-1511499767390-903390e6fbc4?w=500"
        },
        {
            "name": "Cotton Chino Shorts",
            "price": 30.0, "min_price": 20.0,
            "category": "Summer",
            "description": "Classic beige shorts. Casual wear for Karachi heat.",
            "image_url": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500"
        },

        # --- STREETWEAR / FORMAL ---
        {
            "name": "Midnight Velvet Blazer",
            "price": 150.0, "min_price": 120.0,
            "category": "Formal",
            "description": "Slim fit velvet blazer for weddings and formal events.",
            "image_url": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=500"
        },
        {
            "name": "Urban Oversized Hoodie",
            "price": 85.0, "min_price": 60.0,
            "category": "Streetwear",
            "description": "Heavyweight black hoodie with drop shoulders. Trending style.",
            "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500"
        }
    ]

    print(f"Seeding {len(products)} products into HDwear...")

    for p in products:
        await db.product.create(data=p)
        print(f"Created: {p['name']}")

    print("✅ Seed complete! Your store is ready.")
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(seed_products())
