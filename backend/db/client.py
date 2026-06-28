from contextlib import asynccontextmanager
from prisma import Prisma


@asynccontextmanager
async def get_db():
    """
    Async context manager that yields a connected Prisma client and
    guarantees disconnect on exit — even if an exception is raised.

    Usage:
        async with get_db() as db:
            products = await db.product.find_many()
    """
    db = Prisma()
    await db.connect()
    try:
        yield db
    finally:
        if db.is_connected():
            await db.disconnect()
