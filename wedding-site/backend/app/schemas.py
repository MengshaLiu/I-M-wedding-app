from uuid import UUID

from pydantic import BaseModel


class SessionRequest(BaseModel):
    token: str


class SessionResponse(BaseModel):
    jwt: str
    tier: str


class MeResponse(BaseModel):
    tier: str


class TimelineEventOut(BaseModel):
    id: UUID
    starts_at: str
    title: str
    description: str
    location: str | None
    visibility: str
    sort_order: int


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
