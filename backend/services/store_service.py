"""
Store Service — Business logic for store registration, collections, and seller products.
"""

from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

import httpx

from core.config import SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_BUCKET
from db.client import get_db
from services.notification_service import create_notification


# ── Store Registration ────────────────────────────────────────────────────────

async def create_store(
    owner_id: int,
    name: str,
    address: str,
    phone: str,
    categories: List[str],
    description: Optional[str] = None,
) -> Any:
    """Create a new store and set the user's role to 'seller'."""
    async with get_db() as db:
        # Check if user already has a store
        existing = await db.store.find_unique(where={"owner_id": owner_id})
        if existing:
            raise ValueError("You already have a store registered")

        store = await db.store.create(
            data={
                "owner_id": owner_id,
                "name": name.strip(),
                "address": address.strip(),
                "phone": phone.strip(),
                "categories": categories,
                "description": description,
            }
        )

        # Update user role to seller
        await db.user.update(
            where={"id": owner_id},
            data={"role": "seller"},
        )

        return store


async def get_store_by_owner(owner_id: int) -> Any | None:
    async with get_db() as db:
        return await db.store.find_unique(
            where={"owner_id": owner_id},
            include={"collections": True},
        )


async def get_store_by_id(store_id: int) -> Any | None:
    async with get_db() as db:
        return await db.store.find_unique(
            where={"id": store_id},
            include={"collections": True},
        )


async def update_store(store_id: int, owner_id: int, data: Dict[str, Any]) -> Any:
    async with get_db() as db:
        store = await db.store.find_unique(where={"id": store_id})
        if not store or store.owner_id != owner_id:
            raise ValueError("Store not found or access denied")

        update_data = {k: v for k, v in data.items() if v is not None}
        if not update_data:
            return store

        return await db.store.update(where={"id": store_id}, data=update_data)


async def delete_store(store_id: int, owner_id: int) -> None:
    """Delete a store and all its products, and reset the user's role."""
    async with get_db() as db:
        store = await db.store.find_unique(where={"id": store_id})
        if not store or store.owner_id != owner_id:
            raise ValueError("Store not found or access denied")

        # 1. Delete all products individually so Supabase images are cleaned up
        products = await db.product.find_many(where={"store_id": store_id})
        for p in products:
            await delete_seller_product(p.id, store_id)

        # 2. Delete the store itself (cascades collections etc. via DB)
        await db.store.delete(where={"id": store_id})

        # 3. Change user role back to customer
        await db.user.update(
            where={"id": owner_id},
            data={"role": "customer"}
        )

# ── Collections ───────────────────────────────────────────────────────────────

async def create_collection(store_id: int, name: str, description: Optional[str] = None) -> Any:
    async with get_db() as db:
        existing = await db.collection.find_first(
            where={"store_id": store_id, "name": name}
        )
        if existing:
            raise ValueError(f"A collection named '{name}' already exists in your store")

        return await db.collection.create(
            data={
                "store_id": store_id,
                "name": name.strip(),
                "description": description,
            }
        )


async def get_store_collections(store_id: int) -> List[Any]:
    async with get_db() as db:
        collections = await db.collection.find_many(
            where={"store_id": store_id},
            include={"products": True},
            order={"created_at": "desc"},
        )
        return collections


async def delete_collection(collection_id: int, store_id: int) -> None:
    async with get_db() as db:
        collection = await db.collection.find_unique(where={"id": collection_id})
        if not collection or collection.store_id != store_id:
            raise ValueError("Collection not found or access denied")

        # Unlink products from this collection (don't delete them)
        await db.product.update_many(
            where={"collection_id": collection_id},
            data={"collection_id": None},
        )
        await db.collection.delete(where={"id": collection_id})


# ── Image Upload to Supabase Storage ─────────────────────────────────────────

async def upload_image_to_supabase(
    file_content: bytes,
    filename: str,
    store_id: int,
    product_id: int,
    content_type: str = "image/jpeg",
) -> str:
    """Upload an image to Supabase Storage and return its public URL."""
    if not SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_SERVICE_KEY not configured — cannot upload images to Supabase")

    # Generate a unique filename to avoid collisions
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "jpg"
    unique_name = f"{uuid.uuid4().hex[:12]}.{ext}"
    storage_path = f"stores/{store_id}/{product_id}/{unique_name}"

    upload_url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{storage_path}"

    async with httpx.AsyncClient() as client:
        resp = await client.put(
            upload_url,
            content=file_content,
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            timeout=30.0,
        )
        if resp.status_code not in (200, 201):
            raise ValueError(f"Image upload failed: {resp.status_code} {resp.text}")

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{storage_path}"
    return public_url


async def delete_image_from_supabase(image_url: str) -> None:
    """Delete an image from Supabase Storage by its public URL."""
    if not SUPABASE_SERVICE_KEY or not image_url:
        return

    # Extract storage path from public URL
    prefix = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/"
    if not image_url.startswith(prefix):
        return  # Not a supabase storage URL (e.g. seeded product)

    storage_path = image_url[len(prefix):]
    delete_url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}"

    async with httpx.AsyncClient() as client:
        resp = await client.request(
            "DELETE",
            delete_url,
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
            },
            json={"prefixes": [storage_path]},
            timeout=15.0,
        )
        if resp.status_code not in (200, 201):
            print(f"[STORE] Image delete warning: {resp.status_code}")


# ── Seller Products ───────────────────────────────────────────────────────────

async def create_seller_product(store_id: int, data: Dict[str, Any]) -> Any:
    """Create a product linked to a store."""
    async with get_db() as db:
        product = await db.product.create(
            data={
                "store_id": store_id,
                "name": data["name"],
                "price": data["price"],
                "min_price": data["min_price"],
                "description": data.get("description"),
                "detailed_description": data.get("detailed_description"),
                "category": data.get("category"),
                "sub_category": data.get("sub_category"),
                "color": data.get("color"),
                "gender": data.get("gender"),
                "season": data.get("season"),
                "collection_id": data.get("collection_id"),
                "is_negotiable": data.get("is_negotiable", True),
                "material": data.get("material"),
                "style": data.get("style"),
                "occasion": data.get("occasion"),
                "size_options": data.get("size_options"),
                "color_options": data.get("color_options"),
                "stock": data.get("stock", 10),
            }
        )
        
        store = await db.store.find_unique(where={"id": store_id})
        subs = await db.storesubscription.find_many(where={"store_id": store_id})
        if store:
            for sub in subs:
                await create_notification(
                    user_id=sub.user_id,
                    notif_type="new_product",
                    title="New Arrival!",
                    message=f"{store.name} just dropped a new product: {product.name}",
                    link=f"/collections/{product.id}"
                )
                
        return product


async def add_product_image(product_id: int, image_url: str, is_primary: bool = False, sort_order: int = 0) -> Any:
    async with get_db() as db:
        img = await db.productimage.create(
            data={
                "product_id": product_id,
                "image_url": image_url,
                "is_primary": is_primary,
                "sort_order": sort_order,
            }
        )
        # If this is the primary image, also set the product's main image_url
        if is_primary:
            await db.product.update(
                where={"id": product_id},
                data={"image_url": image_url},
            )
        return img


async def update_seller_product(product_id: int, store_id: int, data: Dict[str, Any]) -> Any:
    async with get_db() as db:
        product = await db.product.find_unique(where={"id": product_id})
        if not product or product.store_id != store_id:
            raise ValueError("Product not found or access denied")

        update_data = {k: v for k, v in data.items() if v is not None}
        if not update_data:
            return product

        return await db.product.update(
            where={"id": product_id},
            data=update_data,
        )


async def delete_seller_product(product_id: int, store_id: int) -> None:
    async with get_db() as db:
        product = await db.product.find_unique(
            where={"id": product_id},
            include={"images": True},
        )
        if not product or product.store_id != store_id:
            raise ValueError("Product not found or access denied")

        # Delete images from storage
        if product.images:
            for img in product.images:
                await delete_image_from_supabase(img.image_url)

        # Delete product (cascades to images, reviews, questions via DB)
        await db.product.delete(where={"id": product_id})


async def delete_product_image(image_id: int, store_id: int) -> None:
    """Delete a single image from a product."""
    async with get_db() as db:
        image = await db.productimage.find_unique(
            where={"id": image_id},
            include={"product": True},
        )
        if not image or not image.product or image.product.store_id != store_id:
            raise ValueError("Image not found or access denied")

        # Check that product has more than 1 image
        image_count = await db.productimage.count(
            where={"product_id": image.product_id}
        )
        if image_count <= 1:
            raise ValueError("Cannot delete the last image of a product")

        # Delete from storage
        await delete_image_from_supabase(image.image_url)

        # If this was the primary image, promote the next one
        was_primary = image.is_primary
        await db.productimage.delete(where={"id": image_id})

        if was_primary:
            next_img = await db.productimage.find_first(
                where={"product_id": image.product_id},
                order={"sort_order": "asc"},
            )
            if next_img:
                await db.productimage.update(
                    where={"id": next_img.id},
                    data={"is_primary": True},
                )
                await db.product.update(
                    where={"id": image.product_id},
                    data={"image_url": next_img.image_url},
                )


async def toggle_product_sale(product_id: int, store_id: int, is_on_sale: bool, sale_percentage: int) -> Any:
    async with get_db() as db:
        product = await db.product.find_unique(where={"id": product_id})
        if not product or product.store_id != store_id:
            raise ValueError("Product not found or access denied")

        return await db.product.update(
            where={"id": product_id},
            data={
                "is_on_sale": is_on_sale,
                "sale_percentage": sale_percentage if is_on_sale else 0,
            },
        )


async def get_seller_products(store_id: int, collection_id: Optional[int] = None) -> List[Any]:
    async with get_db() as db:
        where: Dict[str, Any] = {"store_id": store_id}
        if collection_id is not None:
            where["collection_id"] = collection_id

        return await db.product.find_many(
            where=where,
            include={"images": True, "collection": True},
            order={"created_at": "desc"},
        )


async def get_unanswered_questions(store_id: int) -> List[Any]:
    """Get all unanswered questions for products in this store."""
    async with get_db() as db:
        products = await db.product.find_many(
            where={"store_id": store_id},
            include={
                "questions": {
                    "where": {"answer": None},
                    "include": {"user": True, "product": True},
                    "order_by": {"created_at": "desc"},
                }
            },
        )

        questions = []
        for p in products:
            if p.questions:
                questions.extend(p.questions)
        return questions


async def answer_question(question_id: int, store_id: int, answer: str) -> Any:
    async with get_db() as db:
        question = await db.productquestion.find_unique(
            where={"id": question_id},
            include={"product": True},
        )
        if not question or not question.product or question.product.store_id != store_id:
            raise ValueError("Question not found or access denied")

        from datetime import datetime, timezone
        updated = await db.productquestion.update(
            where={"id": question_id},
            data={
                "answer": answer,
                "answered_at": datetime.now(timezone.utc),
            },
        )
        
        await create_notification(
            user_id=question.user_id,
            notif_type="question_answered",
            title=f"Seller answered your question",
            message=f"The seller for {question.product.name} has answered your question.",
            link=f"/collections/{question.product_id}"
        )
        return updated

async def delete_question(question_id: int, store_id: int) -> None:
    async with get_db() as db:
        question = await db.productquestion.find_unique(where={"id": question_id}, include={"product": True})
        if not question or not question.product or question.product.store_id != store_id:
            raise ValueError("Question not found or access denied")
        await db.productquestion.delete(where={"id": question_id})

async def reply_review(review_id: int, store_id: int, reply: str) -> Any:
    async with get_db() as db:
        review = await db.review.find_unique(where={"id": review_id}, include={"product": True})
        if not review or not review.product or review.product.store_id != store_id:
            raise ValueError("Review not found or access denied")
        
        updated = await db.review.update(
            where={"id": review_id},
            data={"reply": reply}
        )

        await create_notification(
            user_id=review.user_id,
            notif_type="review_reply",
            title=f"Seller replied to your review",
            message=f"The seller for {review.product.name} replied to your review.",
            link=f"/collections/{review.product_id}"
        )
        return updated

async def delete_review_comment(review_id: int, store_id: int) -> Any:
    async with get_db() as db:
        review = await db.review.find_unique(where={"id": review_id}, include={"product": True})
        if not review or not review.product or review.product.store_id != store_id:
            raise ValueError("Review not found or access denied")
        
        return await db.review.update(
            where={"id": review_id},
            data={"is_deleted": True, "body": "", "reply": None}
        )

# ── Store Subscriptions ───────────────────────────────────────────────────────

async def subscribe_store(user_id: int, store_id: int) -> dict:
    async with get_db() as db:
        existing = await db.storesubscription.find_first(where={"user_id": user_id, "store_id": store_id})
        if existing:
            return {"status": "already_subscribed"}
        await db.storesubscription.create(data={"user_id": user_id, "store_id": store_id})
        return {"status": "subscribed"}

async def unsubscribe_store(user_id: int, store_id: int) -> dict:
    async with get_db() as db:
        existing = await db.storesubscription.find_first(where={"user_id": user_id, "store_id": store_id})
        if existing:
            await db.storesubscription.delete(where={"id": existing.id})
            return {"status": "unsubscribed"}
        return {"status": "not_subscribed"}

async def is_subscribed(user_id: int, store_id: int) -> bool:
    async with get_db() as db:
        existing = await db.storesubscription.find_first(where={"user_id": user_id, "store_id": store_id})
        return existing is not None
