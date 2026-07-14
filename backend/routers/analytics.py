from fastapi import APIRouter, Request
from datetime import datetime, timezone
from db.client import get_db

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.post("/visit")
async def register_visit(request: Request):
    # Basic IP tracking
    ip_address = request.client.host if request.client else "unknown"
    
    # We use a header if it's behind a proxy
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip_address = forwarded.split(",")[0].strip()

    if ip_address == "unknown" or ip_address == "127.0.0.1" or ip_address == "::1":
        # Can ignore localhost or try to track it anyway
        pass

    async with get_db() as db:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Check if this IP already visited today
        existing_visit = await db.sitevisit.find_first(
            where={
                "ip_address": ip_address,
                "visited_at": {"gte": today_start}
            }
        )

        if not existing_visit:
            await db.sitevisit.create(
                data={
                    "ip_address": ip_address,
                    "visited_at": now
                }
            )

    return {"status": "ok"}
