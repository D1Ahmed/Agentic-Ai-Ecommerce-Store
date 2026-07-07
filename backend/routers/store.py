"""
Store Router — store registration and public store profiles.
"""

from fastapi import APIRouter, Depends, HTTPException

from core.deps import get_current_user
from models.schemas import StoreRegisterRequest, StoreUpdateRequest, StoreResponse
from services.store_service import (
    create_store, get_store_by_owner, get_store_by_id, update_store,
    subscribe_store, unsubscribe_store, is_subscribed
)

router = APIRouter(prefix="/store", tags=["Store"])


def _store_response(store) -> dict:
    return {
        "id": store.id,
        "owner_id": store.owner_id,
        "name": store.name,
        "address": store.address,
        "phone": store.phone,
        "description": store.description,
        "logo_url": store.logo_url,
        "categories": store.categories or [],
        "is_active": store.is_active,
    }


@router.post("/register")
async def register_store(body: StoreRegisterRequest, user=Depends(get_current_user)):
    """Register a new store for the authenticated user."""
    try:
        store = await create_store(
            owner_id=user.id,
            name=body.name,
            address=body.address,
            phone=body.phone,
            categories=body.categories,
            description=body.description,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _store_response(store)


@router.get("/me")
async def my_store(user=Depends(get_current_user)):
    """Get the current user's store."""
    store = await get_store_by_owner(user.id)
    if not store:
        raise HTTPException(status_code=404, detail="You don't have a store yet")
    resp = _store_response(store)
    # Include collections with product counts
    resp["collections"] = [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "icon": c.icon,
            "product_count": len(c.products) if c.products else 0,
        }
        for c in (store.collections or [])
    ]
    return resp


@router.put("/me")
async def update_my_store(body: StoreUpdateRequest, user=Depends(get_current_user)):
    """Update store info."""
    store = await get_store_by_owner(user.id)
    if not store:
        raise HTTPException(status_code=404, detail="You don't have a store yet")
    try:
        updated = await update_store(store.id, user.id, body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return _store_response(updated)


@router.get("/{store_id}")
async def public_store(store_id: int):
    """Get public store profile."""
    store = await get_store_by_id(store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    resp = _store_response(store)
    resp["collections"] = [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "icon": c.icon,
            "product_count": len(c.products) if c.products else 0,
        }
        for c in (store.collections or [])
    ]
    return resp


@router.post("/{store_id}/subscribe")
async def subscribe_to_store(store_id: int, user=Depends(get_current_user)):
    """Subscribe to store notifications."""
    return await subscribe_store(user.id, store_id)

@router.delete("/{store_id}/unsubscribe")
async def unsubscribe_from_store(store_id: int, user=Depends(get_current_user)):
    """Unsubscribe from store notifications."""
    return await unsubscribe_store(user.id, store_id)

@router.get("/{store_id}/is-subscribed")
async def check_store_subscription(store_id: int, user=Depends(get_current_user)):
    """Check if the current user is subscribed to the store."""
    subscribed = await is_subscribed(user.id, store_id)
    return {"is_subscribed": subscribed}

