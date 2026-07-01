"""Run this after `alembic upgrade head` to populate sample data."""

import asyncio
import os
import sys
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy import delete, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://wedding:wedding@localhost:5432/wedding")
INVITE_TOKEN_FULL = os.environ.get("INVITE_TOKEN_FULL", "")
INVITE_TOKEN_RECEPTION = os.environ.get("INVITE_TOKEN_RECEPTION", "")
SITE_URL = os.environ.get("NEXT_PUBLIC_SITE_URL", "http://localhost:3000")


async def seed():
    engine = create_async_engine(DATABASE_URL)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

    async with SessionLocal() as db:
        # Clear existing seed data
        await db.execute(text("DELETE FROM guest_list"))
        await db.execute(text("DELETE FROM tables"))
        await db.execute(text("DELETE FROM timeline_events"))
        await db.execute(text("DELETE FROM site_content"))

        # Tables
        t1 = uuid.uuid4()
        t2 = uuid.uuid4()
        t3 = uuid.uuid4()
        await db.execute(
            text("INSERT INTO tables (id, label) VALUES (:id, :label)"),
            [
                {"id": str(t1), "label": "Table 1 — Orchid"},
                {"id": str(t2), "label": "Table 2 — Lotus"},
                {"id": str(t3), "label": "Table 3 — Rose"},
            ],
        )

        # Guests
        guests = [
            (uuid.uuid4(), "Alice Wong", "Alice", "full", t1),
            (uuid.uuid4(), "Bob Tan", "Bob", "full", t1),
            (uuid.uuid4(), "Charlie Lim", "Charlie", "full", t2),
            (uuid.uuid4(), "Diana Lee", "Diana", "reception", t2),
            (uuid.uuid4(), "Edward Ng", "Edward", "reception", t3),
            (uuid.uuid4(), "Fiona Chong", "Fiona", "reception", t3),
        ]
        for gid, name, display, tier, table_id in guests:
            await db.execute(
                text(
                    "INSERT INTO guest_list (id, name, display_name, tier, table_id) "
                    "VALUES (:id, :name, :display_name, :tier, :table_id)"
                ),
                {"id": str(gid), "name": name, "display_name": display, "tier": tier, "table_id": str(table_id)},
            )

        # Timeline events
        events = [
            (uuid.uuid4(), "10:00 AM", "Guest Arrival & Registration", "Arrive and register at the venue", "Grand Ballroom Foyer", "full_only", 1),
            (uuid.uuid4(), "11:00 AM", "Wedding Ceremony", "Join us for the ceremony", "Grand Ballroom", "full_only", 2),
            (uuid.uuid4(), "12:30 PM", "Cocktail Hour", "Enjoy drinks and canapés", "Garden Terrace", "all", 3),
            (uuid.uuid4(), "2:00 PM", "Wedding Reception Dinner", "Celebrate with a banquet dinner", "Grand Ballroom", "all", 4),
        ]
        for eid, starts_at, title, desc, loc, vis, sort in events:
            await db.execute(
                text(
                    "INSERT INTO timeline_events (id, starts_at, title, description, location, visibility, sort_order) "
                    "VALUES (:id, :starts_at, :title, :description, :location, :visibility, :sort_order)"
                ),
                {
                    "id": str(eid),
                    "starts_at": starts_at,
                    "title": title,
                    "description": desc,
                    "location": loc,
                    "visibility": vis,
                    "sort_order": sort,
                },
            )

        # Site content
        content = {
            "date": {"text": "Saturday, 12 September 2026"},
            "venue_name": {"text": "The Grand Ballroom, Kuala Lumpur"},
            "venue_address": {"text": "No. 20, Jalan Aru, Tanjung Aru, 88100 Kota Kinabalu, Sabah, Malaysia"},
           "venue_map_url": {"text": "https://maps.google.com/?q=123+Jalan+Bukit+Bintang,+55100+Kuala+Lumpur,+Malaysia"},
            "dress_code": {"text": "Formal — Soft florals and pastels welcome"},
        }
        import json
        for key, value in content.items():
            await db.execute(
                text("INSERT INTO site_content (key, value) VALUES (:key, :value) ON CONFLICT (key) DO UPDATE SET value = :value"),
                {"key": key, "value": json.dumps(value)},
            )

        await db.commit()

    await engine.dispose()

    print("\n✅ Seed complete!\n")
    print("─" * 50)
    print("Invite links (share the right one with each group):\n")
    print(f"  Full Guests:      {SITE_URL}/i/{INVITE_TOKEN_FULL}")
    print(f"  Reception Guests: {SITE_URL}/i/{INVITE_TOKEN_RECEPTION}")
    print("\nSample guests seeded:")
    print("  Alice Wong, Bob Tan, Charlie Lim → Full (Table 1/2)")
    print("  Diana Lee, Edward Ng, Fiona Chong → Reception (Table 2/3)")
    print("─" * 50)


if __name__ == "__main__":
    asyncio.run(seed())
