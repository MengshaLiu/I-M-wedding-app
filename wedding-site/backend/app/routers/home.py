from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_tier
from app.models import SiteContent, TimelineEvent
from app.schemas import HomeResponse, TimelineEventOut

router = APIRouter(prefix="/api")


@router.get("/home", response_model=HomeResponse)
async def home(tier: str = Depends(get_current_tier), db: AsyncSession = Depends(get_db)):
    # Fetch site content
    content_rows = (await db.execute(select(SiteContent))).scalars().all()
    content = {row.key: row.value for row in content_rows}

    # Fetch timeline events filtered by tier
    stmt = select(TimelineEvent).order_by(TimelineEvent.sort_order)
    events = (await db.execute(stmt)).scalars().all()

    if tier == "reception":
        events = [e for e in events if e.visibility == "all"]

    return HomeResponse(
        tier=tier,
        date=content.get("date", {}).get("text", ""),
        venue_name=content.get("venue_name", {}).get("text", ""),
        venue_address=content.get("venue_address", {}).get("text", ""),
        venue_map_url=content.get("venue_map_url", {}).get("text", ""),
        dress_code=content.get("dress_code", {}).get("text", ""),
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
