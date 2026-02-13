from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # IMPORT THIS
from routers import chat
from prisma import Prisma
from contextlib import asynccontextmanager

db = Prisma()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.disconnect()

app = FastAPI(lifespan=lifespan)

# --- ADD THIS CORS BLOCK ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------------------

app.include_router(chat.router)


@app.get("/products")
async def get_products():
    products = await db.product.find_many()
    return products
