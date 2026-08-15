import asyncio
import csv
import hmac
import io
import re
import uuid
import zipfile
from datetime import datetime, timedelta, timezone

import qrcode
from PIL import Image as PILImage, ImageDraw
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response, StreamingResponse
from jose import jwt
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.db import get_db
from app.deps import require_admin
from app.models import GuestList, Photo, Table
from app.schemas import (
    AdminLoginRequest,
    AdminLoginResponse,
    AdminPhotoOut,
    GuestCreate,
    GuestImportItem,
    GuestImportResult,
    GuestOut,
    GuestUpdate,
    InviteLinkInfo,
    InviteLinksResponse,
    PhotoStatusUpdate,
    TableCreate,
    TableOut,
    TableUpdate,
)
from app.services import storage

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(body: AdminLoginRequest):
    owner_ok = hmac.compare_digest(body.username, settings.admin_username) and \
               hmac.compare_digest(body.password, settings.admin_password)

    planner_ok = bool(settings.planner_username) and \
                 hmac.compare_digest(body.username, settings.planner_username) and \
                 hmac.compare_digest(body.password, settings.planner_password)

    if not (owner_ok or planner_ok):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = "owner" if owner_ok else "planner"
    now = datetime.now(tz=timezone.utc)
    payload = {
        "admin": True,
        "role": role,
        "sub": body.username,
        "iat": now,
        "exp": now + timedelta(hours=settings.admin_jwt_expire_hours),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return AdminLoginResponse(token=token)


# ── Invite links ──────────────────────────────────────────────────────────────

@router.get("/invite-links", response_model=InviteLinksResponse)
async def get_invite_links(_admin: dict = Depends(require_admin)):
    return InviteLinksResponse(
        full=InviteLinkInfo(
            url=f"{settings.site_url}/i/{settings.invite_token_full}",
            token=settings.invite_token_full,
        ),
        reception=InviteLinkInfo(
            url=f"{settings.site_url}/i/{settings.invite_token_reception}",
            token=settings.invite_token_reception,
        ),
    )


def _make_qr_png(url: str, fill: str, bg: str) -> bytes:
    transparent_bg = bg.lower() == "transparent"
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    buf = io.BytesIO()
    if transparent_bg:
        # qr.modules is the raw data matrix (no border), True = dark module.
        # qr.get_matrix() includes the border already, so using it with an extra
        # border offset causes double-counting and wrong coordinates.
        fill_hex = fill.lstrip("#")
        fill_rgba = tuple(int(fill_hex[i:i+2], 16) for i in (0, 2, 4)) + (255,)
        box = 10
        border = qr.border
        modules = qr.modules
        n = len(modules)
        size = (n + 2 * border) * box
        img = PILImage.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        for y, row in enumerate(modules):
            for x, val in enumerate(row):
                if val:
                    x0 = (x + border) * box
                    y0 = (y + border) * box
                    draw.rectangle([x0, y0, x0 + box - 1, y0 + box - 1], fill=fill_rgba)
        img.save(buf, format="PNG")
    else:
        qr.make_image(fill_color=fill, back_color=bg).save(buf, format="PNG")
    buf.seek(0)
    return buf.read()


@router.get("/invite-links/qr")
async def invite_link_qr(
    tier: str = "full",
    fill: str = "#000000",
    bg: str = "transparent",
    _admin: dict = Depends(require_admin),
):
    if tier not in ("full", "reception"):
        raise HTTPException(400, "tier must be 'full' or 'reception'")
    token = settings.invite_token_full if tier == "full" else settings.invite_token_reception
    url = f"{settings.site_url}/i/{token}"
    png = _make_qr_png(url, fill, bg)
    filename = f"invite-qr-{tier}.png"
    return Response(
        content=png,
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/page-qr")
async def page_qr(
    page: str = Query(...),
    fill: str = "#000000",
    bg: str = "transparent",
    _admin: dict = Depends(require_admin),
):
    allowed = {"seats", "moments"}
    if page not in allowed:
        raise HTTPException(400, f"page must be one of: {', '.join(sorted(allowed))}")
    url = f"{settings.site_url}/{page}"
    png = _make_qr_png(url, fill, bg)
    filename = f"qr-{page}.png"
    return Response(
        content=png,
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Guests ────────────────────────────────────────────────────────────────────

def _guest_out(g: GuestList) -> GuestOut:
    return GuestOut(
        id=str(g.id),
        name=g.name,
        pax=g.pax,
        tier=g.tier,
        table_id=str(g.table_id) if g.table_id else None,
        table_label=g.table.label if g.table else None,
        dietary=g.dietary,
        special_requirements=g.special_requirements,
    )


@router.get("/guests", response_model=list[GuestOut])
async def list_guests(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    rows = (
        await db.execute(
            select(GuestList)
            .options(selectinload(GuestList.table))
            .order_by(GuestList.name)
        )
    ).scalars().all()
    return [_guest_out(g) for g in rows]


@router.post("/guests", response_model=GuestOut, status_code=201)
async def create_guest(
    body: GuestCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    if body.tier not in ("full", "reception"):
        raise HTTPException(400, "tier must be 'full' or 'reception'")

    table_id = None
    if body.table_id:
        try:
            table_id = uuid.UUID(body.table_id)
        except ValueError:
            raise HTTPException(400, "Invalid table_id")
        exists = (await db.execute(select(Table).where(Table.id == table_id))).scalar_one_or_none()
        if not exists:
            raise HTTPException(404, "Table not found")

    guest = GuestList(
        name=body.name.strip(),
        pax=body.pax,
        tier=body.tier,
        table_id=table_id,
        dietary=body.dietary or None,
        special_requirements=body.special_requirements or None,
    )
    db.add(guest)
    await db.commit()

    row = (
        await db.execute(
            select(GuestList).options(selectinload(GuestList.table)).where(GuestList.id == guest.id)
        )
    ).scalar_one()
    return _guest_out(row)


@router.put("/guests/{guest_id}", response_model=GuestOut)
async def update_guest(
    guest_id: str,
    body: GuestUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    try:
        gid = uuid.UUID(guest_id)
    except ValueError:
        raise HTTPException(400, "Invalid guest_id")

    guest = (
        await db.execute(
            select(GuestList).options(selectinload(GuestList.table)).where(GuestList.id == gid)
        )
    ).scalar_one_or_none()
    if not guest:
        raise HTTPException(404, "Guest not found")

    if body.name is not None:
        guest.name = body.name.strip()
    guest.pax = body.pax
    if body.tier is not None:
        if body.tier not in ("full", "reception"):
            raise HTTPException(400, "tier must be 'full' or 'reception'")
        guest.tier = body.tier
    guest.dietary = body.dietary or None
    guest.special_requirements = body.special_requirements or None
    if body.clear_table:
        guest.table_id = None
    elif body.table_id is not None:
        try:
            tid = uuid.UUID(body.table_id)
        except ValueError:
            raise HTTPException(400, "Invalid table_id")
        exists = (await db.execute(select(Table).where(Table.id == tid))).scalar_one_or_none()
        if not exists:
            raise HTTPException(404, "Table not found")
        guest.table_id = tid

    await db.commit()

    row = (
        await db.execute(
            select(GuestList).options(selectinload(GuestList.table)).where(GuestList.id == gid)
        )
    ).scalar_one()
    return _guest_out(row)


@router.delete("/guests/{guest_id}", status_code=204)
async def delete_guest(
    guest_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    try:
        gid = uuid.UUID(guest_id)
    except ValueError:
        raise HTTPException(400, "Invalid guest_id")

    guest = (await db.execute(select(GuestList).where(GuestList.id == gid))).scalar_one_or_none()
    if not guest:
        raise HTTPException(404, "Guest not found")

    await db.delete(guest)
    await db.commit()


@router.post("/guests/import", response_model=GuestImportResult)
async def import_guests(
    items: list[GuestImportItem],
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    # Pre-load tables for label→id lookup (case-insensitive)
    all_tables = (await db.execute(select(Table))).scalars().all()
    table_by_label = {t.label.strip().lower(): t.id for t in all_tables}

    # Pre-load existing guest names to detect duplicates
    existing_names = {
        g.name.strip().lower()
        for g in (await db.execute(select(GuestList))).scalars().all()
    }

    created = 0
    skipped = 0
    errors: list[str] = []

    for idx, item in enumerate(items, start=1):
        name = item.name.strip()
        if not name:
            errors.append(f"Row {idx}: name is required.")
            skipped += 1
            continue

        if item.tier not in ("full", "reception"):
            errors.append(f"Row {idx} ({name}): tier must be 'full' or 'reception', got '{item.tier}'.")
            skipped += 1
            continue

        if name.lower() in existing_names:
            errors.append(f"Row {idx}: '{name}' already exists — skipped.")
            skipped += 1
            continue

        table_id = None
        if item.table_label:
            table_id = table_by_label.get(item.table_label.strip().lower())
            if table_id is None:
                errors.append(f"Row {idx} ({name}): table '{item.table_label}' not found — guest created without table assignment.")

        guest = GuestList(name=name, tier=item.tier, table_id=table_id)
        db.add(guest)
        existing_names.add(name.lower())
        created += 1

    await db.commit()
    return GuestImportResult(created=created, skipped=skipped, errors=errors)


@router.get("/guests/export")
async def export_guests(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    rows = (
        await db.execute(
            select(GuestList)
            .options(selectinload(GuestList.table))
            .order_by(GuestList.name)
        )
    ).scalars().all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["Name", "Pax", "Tier", "Table"])
    for g in rows:
        writer.writerow([g.name, g.pax if g.pax is not None else "", g.tier, g.table.label if g.table else ""])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="guests.csv"'},
    )


# ── Tables ────────────────────────────────────────────────────────────────────

@router.get("/tables", response_model=list[TableOut])
async def list_tables(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    rows = (
        await db.execute(
            select(Table, func.count(GuestList.id).label("guest_count"))
            .outerjoin(GuestList, GuestList.table_id == Table.id)
            .group_by(Table.id)
            .order_by(Table.label)
        )
    ).all()

    return [
        TableOut(
            id=str(t.id),
            label=t.label,
            note=t.note,
            guest_count=count,
        )
        for t, count in rows
    ]


@router.post("/tables", response_model=TableOut, status_code=201)
async def create_table(
    body: TableCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    table = Table(label=body.label.strip(), note=body.note)
    db.add(table)
    await db.commit()
    return TableOut(id=str(table.id), label=table.label, note=table.note, guest_count=0)


@router.put("/tables/{table_id}", response_model=TableOut)
async def update_table(
    table_id: str,
    body: TableUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    try:
        tid = uuid.UUID(table_id)
    except ValueError:
        raise HTTPException(400, "Invalid table_id")

    table = (await db.execute(select(Table).where(Table.id == tid))).scalar_one_or_none()
    if not table:
        raise HTTPException(404, "Table not found")

    if body.label is not None:
        table.label = body.label.strip()
    if body.note is not None:
        table.note = body.note

    await db.commit()

    count = (
        await db.execute(
            select(func.count()).select_from(GuestList).where(GuestList.table_id == tid)
        )
    ).scalar() or 0
    return TableOut(id=str(table.id), label=table.label, note=table.note, guest_count=count)


@router.delete("/tables/{table_id}", status_code=204)
async def delete_table(
    table_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    try:
        tid = uuid.UUID(table_id)
    except ValueError:
        raise HTTPException(400, "Invalid table_id")

    table = (await db.execute(select(Table).where(Table.id == tid))).scalar_one_or_none()
    if not table:
        raise HTTPException(404, "Table not found")

    # Unassign guests first
    guests = (await db.execute(select(GuestList).where(GuestList.table_id == tid))).scalars().all()
    for g in guests:
        g.table_id = None

    await db.delete(table)
    await db.commit()


# ── Photos ────────────────────────────────────────────────────────────────────

@router.get("/photos", response_model=list[AdminPhotoOut])
async def list_photos(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    rows = (
        await db.execute(select(Photo).order_by(Photo.created_at.desc()))
    ).scalars().all()

    return [
        AdminPhotoOut(
            id=str(p.id),
            uploader_name=p.uploader_name,
            message=p.message,
            url=storage.public_url(p.storage_key),
            thumb_url=storage.public_url(p.thumb_key),
            original_url=storage.public_url(p.original_key) if p.original_key else None,
            status=p.status,
            created_at=p.created_at.isoformat(),
        )
        for p in rows
    ]


@router.get("/photos/download-zip")
async def download_photos_zip(
    ids: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    if ids:
        id_list = []
        for raw in ids.split(","):
            raw = raw.strip()
            try:
                id_list.append(uuid.UUID(raw))
            except ValueError:
                pass
        rows = (
            await db.execute(select(Photo).where(Photo.id.in_(id_list)))
        ).scalars().all()
    else:
        rows = (
            await db.execute(select(Photo).order_by(Photo.created_at.asc()))
        ).scalars().all()

    rows = [p for p in rows if p.original_key]
    if not rows:
        raise HTTPException(404, "No photos with originals found")

    buf = io.BytesIO()
    loop = asyncio.get_event_loop()

    with zipfile.ZipFile(buf, "w", zipfile.ZIP_STORED) as zf:
        for p in rows:
            data = await loop.run_in_executor(
                None, lambda key=p.original_key: storage.download(key)
            )
            ext = p.original_key.rsplit(".", 1)[-1] if "." in p.original_key else "jpg"
            date_str = p.created_at.strftime("%Y%m%d")
            safe_name = re.sub(r"[^\w]", "_", p.uploader_name)[:30]
            filename = f"{date_str}_{safe_name}_{str(p.id)[:8]}.{ext}"
            zf.writestr(filename, data)

    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="wedding-photos.zip"'},
    )


@router.patch("/photos/{photo_id}", response_model=AdminPhotoOut)
async def update_photo(
    photo_id: str,
    body: PhotoStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    if body.status not in ("visible", "hidden"):
        raise HTTPException(400, "status must be 'visible' or 'hidden'")

    try:
        pid = uuid.UUID(photo_id)
    except ValueError:
        raise HTTPException(400, "Invalid photo_id")

    photo = (await db.execute(select(Photo).where(Photo.id == pid))).scalar_one_or_none()
    if not photo:
        raise HTTPException(404, "Photo not found")

    photo.status = body.status
    await db.commit()

    return AdminPhotoOut(
        id=str(photo.id),
        uploader_name=photo.uploader_name,
        message=photo.message,
        url=storage.public_url(photo.storage_key),
        thumb_url=storage.public_url(photo.thumb_key),
        original_url=storage.public_url(photo.original_key) if photo.original_key else None,
        status=photo.status,
        created_at=photo.created_at.isoformat(),
    )


@router.delete("/photos/{photo_id}", status_code=204)
async def delete_photo(
    photo_id: str,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    try:
        pid = uuid.UUID(photo_id)
    except ValueError:
        raise HTTPException(400, "Invalid photo_id")

    photo = (await db.execute(select(Photo).where(Photo.id == pid))).scalar_one_or_none()
    if not photo:
        raise HTTPException(404, "Photo not found")

    keys = [k for k in [photo.storage_key, photo.thumb_key, photo.original_key] if k]
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: storage.delete_objects(keys))

    await db.delete(photo)
    await db.commit()
