"""Run this after `alembic upgrade head` to populate sample data."""

import asyncio
import os
import sys
import uuid

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

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
