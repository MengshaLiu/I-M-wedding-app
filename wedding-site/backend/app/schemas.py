from pydantic import BaseModel


class SessionRequest(BaseModel):
    token: str


class SessionResponse(BaseModel):
    jwt: str
    tier: str


class MeResponse(BaseModel):
    tier: str


class TimelineEventOut(BaseModel):
    id: str
    starts_at: str
    title: str
    description: str


class HomeResponse(BaseModel):
    tier: str
    date: str
    venue_name: str
    venue_address: str
    venue_map_url: str
    dress_code: str
    timeline: list[TimelineEventOut]


class SeatResult(BaseModel):
    display_name: str
    table_label: str


class SeatsResponse(BaseModel):
    results: list[SeatResult]
    query: str


# ── Gallery ──────────────────────────────────────────────────────────────────

class PhotoOut(BaseModel):
    id: str
    uploader_name: str
    message: str | None
    url: str
    thumb_url: str
    created_at: str


class GalleryResponse(BaseModel):
    photos: list[PhotoOut]
    total: int
    page: int
    per_page: int


# ── Travel guide ─────────────────────────────────────────────────────────────

class TravelItem(BaseModel):
    name: str
    description: str
    tip: str | None = None


class TravelSection(BaseModel):
    title: str
    items: list[TravelItem]


class TravelResponse(BaseModel):
    sections: list[TravelSection]
