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
    starts_at: str | None = None
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
    name: str
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


# ── Admin ────────────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginResponse(BaseModel):
    token: str


class GuestOut(BaseModel):
    id: str
    name: str
    pax: int | None
    tier: str
    table_id: str | None
    table_label: str | None


class GuestCreate(BaseModel):
    name: str
    pax: int | None = None
    tier: str
    table_id: str | None = None


class GuestUpdate(BaseModel):
    name: str | None = None
    pax: int | None = None
    tier: str | None = None
    table_id: str | None = None
    clear_table: bool = False  # set True to explicitly unassign table


class TableOut(BaseModel):
    id: str
    label: str
    note: str | None
    guest_count: int


class TableCreate(BaseModel):
    label: str
    note: str | None = None


class TableUpdate(BaseModel):
    label: str | None = None
    note: str | None = None


class AdminPhotoOut(BaseModel):
    id: str
    uploader_name: str
    message: str | None
    url: str
    thumb_url: str
    original_url: str | None
    status: str
    created_at: str


class PhotoStatusUpdate(BaseModel):
    status: str  # "visible" | "hidden"


class GuestImportItem(BaseModel):
    name: str
    tier: str = "full"
    table_label: str | None = None


class GuestImportResult(BaseModel):
    created: int
    skipped: int
    errors: list[str]


class InviteLinkInfo(BaseModel):
    url: str
    token: str


class InviteLinksResponse(BaseModel):
    full: InviteLinkInfo
    reception: InviteLinkInfo


# ── Travel guide ─────────────────────────────────────────────────────────────

class TravelItem(BaseModel):
    name: str
    description: str
    tip: str | None = None
    link: str | None = None
    ios_link: str | None = None
    android_link: str | None = None


class TravelSection(BaseModel):
    title: str
    items: list[TravelItem]


class TravelResponse(BaseModel):
    sections: list[TravelSection]
