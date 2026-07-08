import asyncio
from db.client import get_db
from services.auth_service import hash_password

async def make_admin():
    async with get_db() as db:
        user = await db.user.find_unique(where={"email": "admin@"})
        if not user:
            user = await db.user.create(data={
                "email": "admin@",
                "password_hash": hash_password("admin@123@"),
                "name": "Admin User",
                "role": "admin"
            })
        else:
            user = await db.user.update(
                where={"email": "admin@"},
                data={
                    "role": "admin",
                    "password_hash": hash_password("admin@123@")
                }
            )
        print("Admin created/updated successfully.")

asyncio.run(make_admin())
