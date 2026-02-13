import asyncio
from prisma import Prisma
import os
from dotenv import load_dotenv

load_dotenv()


async def test_connection():
    db = Prisma()
    try:
        print("🔄 Attempting to connect to Supabase...")
        await db.connect()

        # 1. Check if we can read the table
        count = await db.product.count()
        print(f"✅ Connection Successful!")
        print(f"📊 Current Product Count: {count}")

    except Exception as e:
        print(f"❌ Connection Failed!")
        print(f"Error details: {e}")
        print("\n💡 Troubleshooting Tips:")
        print("- Check if DATABASE_URL in .env has '?pgbouncer=true'")
        print("- Ensure you are using Port 5432 (Session Mode)")
    finally:
        if db.is_connected():
            await db.disconnect()

if __name__ == "__main__":
    asyncio.run(test_connection())
