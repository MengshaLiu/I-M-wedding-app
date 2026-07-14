from fastapi import APIRouter, Depends, Query
from rapidfuzz import process as fuzz_process
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_tier
from app.models import GuestList, Table
from app.schemas import SeatResult, SeatsResponse

router = APIRouter(prefix="/api")

_FUZZY_SCORE_CUTOFF = 70
_MAX_RESULTS = 5


@router.get("/seats", response_model=SeatsResponse)
async def seats(
    q: str = Query(..., min_length=1, max_length=100),
    tier: str = Depends(get_current_tier),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(GuestList).where(GuestList.table_id.isnot(None))
    guests = (await db.execute(stmt)).scalars().all()

    if not guests:
        return SeatsResponse(results=[], query=q)

    names = [g.name for g in guests]
    matches = fuzz_process.extract(
        q.strip(),
        names,
        limit=_MAX_RESULTS,
        score_cutoff=_FUZZY_SCORE_CUTOFF,
    )

    if not matches:
        return SeatsResponse(results=[], query=q)

    # Resolve tables for matched guests
    guest_map = {g.name: g for g in guests}
    table_ids = list({guest_map[name].table_id for name, _, _ in matches if name in guest_map})
    table_rows = (await db.execute(select(Table).where(Table.id.in_(table_ids)))).scalars().all()
    table_label_map = {t.id: t.label for t in table_rows}

    results = []
    for name, _score, _idx in matches:
        guest = guest_map.get(name)
        if guest and guest.table_id:
            results.append(
                SeatResult(
                    name=guest.name,
                    table_label=table_label_map.get(guest.table_id, "Unknown"),
                )
            )

    return SeatsResponse(results=results, query=q)
