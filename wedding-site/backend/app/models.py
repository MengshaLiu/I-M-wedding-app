import uuid

from sqlalchemy import Enum, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base

TierEnum = Enum("full", "reception", name="tier_enum")
VisibilityEnum = Enum("all", "full_only", name="visibility_enum")


class Table(Base):
    __tablename__ = "tables"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    note: Mapped[str | None] = mapped_column(Text)

    guests: Mapped[list["GuestList"]] = relationship("GuestList", back_populates="table")


class GuestList(Base):
    __tablename__ = "guest_list"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    display_name: Mapped[str] = mapped_column(Text, nullable=False)
    tier: Mapped[str] = mapped_column(TierEnum, nullable=False)
    table_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("tables.id"))

    table: Mapped["Table | None"] = relationship("Table", back_populates="guests")


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    starts_at: Mapped[str] = mapped_column(Text, nullable=False)  # stored as ISO string for simplicity
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str | None] = mapped_column(Text)
    visibility: Mapped[str] = mapped_column(VisibilityEnum, nullable=False, default="all")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class SiteContent(Base):
    __tablename__ = "site_content"

    key: Mapped[str] = mapped_column(Text, primary_key=True)
    value: Mapped[dict] = mapped_column(JSONB, nullable=False)
