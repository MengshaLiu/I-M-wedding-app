from fastapi import APIRouter, Depends

from app.deps import get_current_tier
from app.schemas import HomeResponse, TimelineEventOut

router = APIRouter(prefix="/api")

# ── Wedding details — edit here to update the site ──────────────────────────
WEDDING_DATE = "Saturday, 12 September 2026"
VENUE_NAME = "Shangri-La Tanjung Aru"
VENUE_ADDRESS = "No. 20, Jalan Aru, Tanjung Aru, 88100 Kota Kinabalu, Sabah, Malaysia"
VENUE_MAP_URL = "https://maps.app.goo.gl/Q2UqWTeGjsryFikd7"
DRESS_CODE = "Formal — Soft florals and pastels welcome"

TIMELINE = [
    {"id": "evt-1", "starts_at": "10:00 AM", "title": "Arrival & Registration at the Pavilion", "description": "Grab a welcome drink, find your seat, and soak in the tropical breeze", "visibility": "full_only"},
    {"id": "evt-2", "starts_at": "11:00 AM", "title": "Wedding Ceremony",             "description": "The moment we say 'I do'. Tissues recommended, happy tears only",             "visibility": "full_only"},
    {"id": "evt-3", "starts_at": "12:30 PM", "title": "Cocktail Hour",                "description": "Mingle, clink glasses, and enjoy canapés while we sneak off for photos",             "visibility": "all"},
    {"id": "evt-4", "starts_at": "2:00 PM",  "title": "Wedding Reception Dinner",     "description": "A sumptuous Chinese feast shared among good company",     "visibility": "all"},
]
# ────────────────────────────────────────────────────────────────────────────


@router.get("/home", response_model=HomeResponse)
async def home(tier: str = Depends(get_current_tier)):
    events = TIMELINE if tier == "full" else [e for e in TIMELINE if e["visibility"] == "all"]

    return HomeResponse(
        tier=tier,
        date=WEDDING_DATE,
        venue_name=VENUE_NAME,
        venue_address=VENUE_ADDRESS,
        venue_map_url=VENUE_MAP_URL,
        dress_code=DRESS_CODE,
        timeline=[
            TimelineEventOut(id=e["id"], starts_at=e["starts_at"], title=e["title"], description=e["description"])
            for e in events
        ],
    )
