"""
Seller Router — collection management, product CRUD, sale toggle, notifications.
All endpoints require the user to be a seller (have a store).
"""

import json
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from core.deps import get_current_user
from models.schemas import (
    CollectionCreateRequest,
    SellerProductUpdate,
    ProductSaleToggle,
    AnswerRequest,
    ReplyRequest,
)
from services.store_service import (
    get_store_by_owner,
    create_collection,
    get_store_collections,
    delete_collection,
    create_seller_product,
    upload_image_to_supabase,
    add_product_image,
    update_seller_product,
    delete_seller_product,
    delete_product_image,
    toggle_product_sale,
    get_seller_products,
    get_unanswered_questions,
    answer_question,
    reply_review,
    delete_review_comment,
    delete_question,
)

router = APIRouter(prefix="/seller", tags=["Seller"])


async def _require_store(user):
    """Helper: get the user's store or 403."""
    store = await get_store_by_owner(user.id)
    if not store:
        raise HTTPException(status_code=403, detail="You need to register a store first")
    return store


# ── Collections ───────────────────────────────────────────────────────────────

@router.post("/collections")
async def create_new_collection(body: CollectionCreateRequest, user=Depends(get_current_user)):
    store = await _require_store(user)
    try:
        collection = await create_collection(store.id, body.name, body.description)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "id": collection.id,
        "store_id": collection.store_id,
        "name": collection.name,
        "description": collection.description,
        "icon": collection.icon,
        "product_count": 0,
    }


@router.get("/collections")
async def list_collections(user=Depends(get_current_user)):
    store = await _require_store(user)
    collections = await get_store_collections(store.id)
    return [
        {
            "id": c.id,
            "store_id": c.store_id,
            "name": c.name,
            "description": c.description,
            "icon": c.icon,
            "product_count": len(c.products) if c.products else 0,
        }
        for c in collections
    ]


@router.delete("/collections/{collection_id}")
async def remove_collection(collection_id: int, user=Depends(get_current_user)):
    store = await _require_store(user)
    try:
        await delete_collection(collection_id, store.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"status": "deleted"}


# ── Products ──────────────────────────────────────────────────────────────────

@router.post("/products")
async def upload_product(
    user=Depends(get_current_user),
    images: list[UploadFile] = File(...),
    name: str = Form(...),
    description: str = Form(...),
    detailed_description: str = Form(...),
    price: float = Form(...),
    min_price: float = Form(...),
    category: str = Form(...),
    sub_category: str = Form(...),
    color: str = Form(...),
    gender: str = Form(...),
    season: str = Form(...),
    collection_id: int = Form(...),
    is_negotiable: bool = Form(True),
    material: Optional[str] = Form(None),
    style: Optional[str] = Form(None),
    occasion: Optional[str] = Form(None),
    size_options: Optional[str] = Form(None),
    color_options: Optional[str] = Form(None),
    stock: int = Form(10),
):
    """Upload a new product with 1-5 images."""
    store = await _require_store(user)

    # Validate image count
    if len(images) < 1:
        raise HTTPException(status_code=400, detail="At least 1 image is required")
    if len(images) > 5:
        raise HTTPException(status_code=400, detail="Maximum 5 images allowed")

    # Validate image types
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/avif", "image/jpg"}
    for img in images:
        if img.content_type and img.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Invalid image type: {img.content_type}")

    # Create the product first (without images)
    product_data = {
        "name": name,
        "description": description,
        "detailed_description": detailed_description,
        "price": price,
        "min_price": min_price,
        "category": category,
        "sub_category": sub_category,
        "color": color,
        "gender": gender,
        "season": season,
        "collection_id": collection_id,
        "is_negotiable": is_negotiable,
        "material": material,
        "style": style,
        "occasion": occasion,
        "size_options": size_options,
        "color_options": color_options,
        "stock": stock,
    }

    product = await create_seller_product(store.id, product_data)

    # Upload images
    uploaded_images = []
    for idx, img_file in enumerate(images):
        content = await img_file.read()
        try:
            public_url = await upload_image_to_supabase(
                file_content=content,
                filename=img_file.filename or f"image_{idx}.jpg",
                store_id=store.id,
                product_id=product.id,
                content_type=img_file.content_type or "image/jpeg",
            )
            img_record = await add_product_image(
                product_id=product.id,
                image_url=public_url,
                is_primary=(idx == 0),
                sort_order=idx,
            )
            uploaded_images.append({"id": img_record.id, "url": public_url, "is_primary": idx == 0})
        except Exception as e:
            # Rollback product creation since image upload failed
            await delete_seller_product(product.id, store.id)
            print(f"[SELLER] Image upload failed for {img_file.filename}: {e}")
            raise HTTPException(status_code=400, detail=f"Image upload failed: {str(e)}. Please check your Supabase keys.")

    # Trigger RAG refresh
    try:
        from services.rag_service import refresh_index
        await refresh_index()
    except Exception as e:
        print(f"[SELLER] RAG refresh failed (non-critical): {e}")

    return {
        "id": product.id,
        "name": product.name,
        "price": product.price,
        "image_url": product.image_url,
        "images": uploaded_images,
        "store_id": store.id,
        "collection_id": product.collection_id,
    }


@router.put("/products/{product_id}")
async def edit_product(product_id: int, body: SellerProductUpdate, user=Depends(get_current_user)):
    store = await _require_store(user)
    try:
        product = await update_seller_product(product_id, store.id, body.model_dump(exclude_none=True))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Trigger RAG refresh
    try:
        from services.rag_service import refresh_index
        await refresh_index()
    except Exception:
        pass

    return {"status": "updated", "id": product.id, "name": product.name}


@router.delete("/products/{product_id}")
async def remove_product(product_id: int, user=Depends(get_current_user)):
    store = await _require_store(user)
    try:
        await delete_seller_product(product_id, store.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Trigger RAG refresh
    try:
        from services.rag_service import refresh_index
        await refresh_index()
    except Exception:
        pass

    return {"status": "deleted"}


@router.delete("/products/{product_id}/images/{image_id}")
async def remove_product_image(product_id: int, image_id: int, user=Depends(get_current_user)):
    """Delete a single image from a product (must keep at least 1)."""
    store = await _require_store(user)
    try:
        await delete_product_image(image_id, store.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"status": "deleted"}


@router.post("/products/{product_id}/images")
async def add_images_to_product(
    product_id: int,
    user=Depends(get_current_user),
    images: list[UploadFile] = File(...),
):
    """Add additional images to an existing product (max 5 total)."""
    store = await _require_store(user)

    from db.client import get_db
    async with get_db() as db:
        product = await db.product.find_unique(
            where={"id": product_id},
            include={"images": True},
        )
        if not product or product.store_id != store.id:
            raise HTTPException(status_code=404, detail="Product not found")

        current_count = len(product.images) if product.images else 0
        if current_count + len(images) > 5:
            raise HTTPException(
                status_code=400,
                detail=f"Product already has {current_count} images. Max 5 allowed."
            )

    uploaded = []
    for idx, img_file in enumerate(images):
        content = await img_file.read()
        try:
            url = await upload_image_to_supabase(
                file_content=content,
                filename=img_file.filename or f"image_{idx}.jpg",
                store_id=store.id,
                product_id=product_id,
                content_type=img_file.content_type or "image/jpeg",
            )
            img_record = await add_product_image(
                product_id=product_id,
                image_url=url,
                is_primary=False,
                sort_order=current_count + idx,
            )
            uploaded.append({"id": img_record.id, "url": url})
        except Exception as e:
            print(f"[SELLER] Image upload failed: {e}")

    return {"status": "ok", "uploaded": uploaded}


@router.put("/products/{product_id}/sale")
async def set_product_sale(product_id: int, body: ProductSaleToggle, user=Depends(get_current_user)):
    store = await _require_store(user)
    try:
        product = await toggle_product_sale(product_id, store.id, body.is_on_sale, body.sale_percentage)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "id": product.id,
        "is_on_sale": product.is_on_sale,
        "sale_percentage": product.sale_percentage,
    }


@router.get("/products")
async def list_my_products(
    user=Depends(get_current_user),
    collection_id: Optional[int] = Query(None),
):
    store = await _require_store(user)
    products = await get_seller_products(store.id, collection_id)
    return [
        {
            "id": p.id,
            "name": p.name,
            "price": p.price,
            "min_price": p.min_price,
            "image_url": p.image_url,
            "stock": p.stock,
            "is_on_sale": p.is_on_sale,
            "sale_percentage": p.sale_percentage,
            "is_negotiable": p.is_negotiable,
            "category": p.category,
            "collection_id": p.collection_id,
            "collection_name": p.collection.name if p.collection else None,
            "images": [{"id": img.id, "url": img.image_url, "is_primary": img.is_primary} for img in (p.images or [])],
            "view_count": p.view_count,
            "purchase_count": p.purchase_count,
            "rating": p.rating,
            "reviews_count": p.reviews_count,
        }
        for p in products
    ]


# ── Notifications (Q&A) ──────────────────────────────────────────────────────

@router.get("/notifications")
async def get_notifications(user=Depends(get_current_user)):
    store = await _require_store(user)
    questions = await get_unanswered_questions(store.id)
    return {
        "count": len(questions),
        "questions": [
            {
                "id": q.id,
                "product_id": q.product_id,
                "product_name": q.product.name if q.product else "",
                "user_name": q.user.name if q.user else "",
                "question": q.question,
                "created_at": q.created_at.isoformat() if q.created_at else "",
            }
            for q in questions
        ],
    }


@router.put("/questions/{question_id}/answer")
async def answer_q(question_id: int, body: AnswerRequest, user=Depends(get_current_user)):
    store = await _require_store(user)
    try:
        q = await answer_question(question_id, store.id, body.answer)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"status": "ok", "id": q.id}

@router.delete("/questions/{question_id}")
async def delete_product_question(question_id: int, user=Depends(get_current_user)):
    store = await _require_store(user)
    try:
        await delete_question(question_id, store.id)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/reviews/{review_id}/reply")
async def reply_product_review(review_id: int, body: ReplyRequest, user=Depends(get_current_user)):
    store = await _require_store(user)
    try:
        updated = await reply_review(review_id, store.id, body.reply)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/reviews/{review_id}/comment")
async def delete_product_review_comment(review_id: int, user=Depends(get_current_user)):
    store = await _require_store(user)
    try:
        await delete_review_comment(review_id, store.id)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
