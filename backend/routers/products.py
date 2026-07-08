from fastapi import APIRouter, Query, Depends, HTTPException
from services.product_service import get_all_products, search_products, delete_product
from core.deps import get_current_user

router = APIRouter(prefix="/products", tags=["Products"])

@router.delete("/{product_id}")
async def remove_product(product_id: int, user = Depends(get_current_user)):
    """Delete a product. Only accessible by admins."""
    if getattr(user, "role", "") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    await delete_product(product_id)
    return {"status": "ok"}


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
