from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_tier
from app.models import TimelineEvent
from app.schemas import HomeResponse, TimelineEventOut

router = APIRouter(prefix="/api")

# ── Wedding details — edit here to update the site ──────────────────────────
WEDDING_DATE = "Saturday, 12 September 2026"
VENUE_NAME = "Shangri-La Tanjung Aru"
VENUE_ADDRESS = "No. 20, Jalan Aru, Tanjung Aru, 88100 Kota Kinabalu, Sabah, Malaysia"
VENUE_MAP_URL = "https://maps.app.goo.gl/Q2UqWTeGjsryFikd7"
DRESS_CODE = "Formal — Soft florals and pastels welcome"
# ────────────────────────────────────────────────────────────────────────────


@router.get("/home", response_model=HomeResponse)
async def home(tier: str = Depends(get_current_tier), db: AsyncSession = Depends(get_db)):
    stmt = select(TimelineEvent).order_by(TimelineEvent.sort_order)
    events = (await db.execute(stmt)).scalars().all()

    if tier == "reception":
        events = [e for e in events if e.visibility == "all"]

    return HomeResponse(
        tier=tier,
        date=WEDDING_DATE,
        venue_name=VENUE_NAME,
        venue_address=VENUE_ADDRESS,
        venue_map_url=VENUE_MAP_URL,
        dress_code=DRESS_CODE,
        timeline=[
            TimelineEventOut(
                id=e.id,
                starts_at=e.starts_at,
                title=e.title,
                description=e.description,
                location=e.location,
                visibility=e.visibility,
                sort_order=e.sort_order,
            )
            for e in events
        ],
    )
