from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import CORS_ORIGINS
from routers import products, orders, chat, auth, cart, store, seller, reviews, notifications


import asyncio



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load catalogue immediately; build semantic index in the background."""
    from db.client import global_db
    await global_db.connect()
    
    from services.rag_service import init_catalog, build_index
    await init_catalog()
    asyncio.create_task(build_index())
    
    yield
    
    if global_db.is_connected():
        await global_db.disconnect()


app = FastAPI(
    title="HDwear API",
    description="Backend for the HDwear urban fashion e-commerce platform.",
    version="3.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(chat.router)
app.include_router(auth.router)
app.include_router(cart.router)
app.include_router(store.router)
app.include_router(seller.router)
app.include_router(reviews.router)
app.include_router(notifications.router)


@app.get("/health", tags=["Health"])
async def health():
    from services.rag_service import is_ready, semantic_ready, _products
    return {
        "status": "ok",
        "catalog_ready": is_ready(),
        "semantic_index_ready": semantic_ready(),
        "products_indexed": len(_products),
    }
