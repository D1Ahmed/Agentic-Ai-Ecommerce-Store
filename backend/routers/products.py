from fastapi import APIRouter, Query
from services.product_service import get_all_products, search_products

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("")
async def list_products():
    """Return the full product catalogue."""
    return await get_all_products()


@router.get("/search")
async def find_products(q: str = Query("", description="Search query")):
    """
    Search products by name, description, category, color, sub-category,
    season, gender, or detailed description.
    Returns an empty list when no query is provided.
    """
    return await search_products(q)
