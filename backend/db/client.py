from contextlib import asynccontextmanager
from prisma import Prisma


# Global instance
global_db = Prisma()

@asynccontextmanager
async def get_db():
    """
    Async context manager that yields the global connected Prisma client.
    
    Usage:
        async with get_db() as db:
            products = await db.product.find_many()
    """
    yield global_db
