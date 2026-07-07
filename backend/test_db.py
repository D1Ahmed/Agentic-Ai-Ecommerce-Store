import asyncio
from db.client import get_db

async def main():
    async with get_db() as db:
        products = await db.product.find_many(take=5, include={"store": True})
        for p in products:
            print(f"ID: {p.id}, Name: {p.name}, Store: {p.store_id}, Created: {p.created_at}")

if __name__ == "__main__":
    asyncio.run(main())
