import asyncio
import csv
import hmac
import io
import re
import uuid
import zipfile
from datetime import datetime, timedelta, timezone

import qrcode
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
    username_ok = hmac.compare_digest(body.username, settings.admin_username)
    password_ok = hmac.compare_digest(body.password, settings.admin_password)
    if not (username_ok and password_ok):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    now = datetime.now(tz=timezone.utc)
    payload = {
        "admin": True,
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


@router.get("/invite-links/qr")
async def invite_link_qr(tier: str = "full", _admin: dict = Depends(require_admin)):
    if tier not in ("full", "reception"):
        raise HTTPException(400, "tier must be 'full' or 'reception'")

    token = settings.invite_token_full if tier == "full" else settings.invite_token_reception
    url = f"{settings.site_url}/i/{token}"

    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    filename = f"invite-qr-{tier}.png"
    return Response(
        content=buf.read(),
        media_type="image/png",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Guests ────────────────────────────────────────────────────────────────────

def _guest_out(g: GuestList) -> GuestOut:
    return GuestOut(
        id=str(g.id),
        name=g.name,
        display_name=g.display_name,
        tier=g.tier,
        table_id=str(g.table_id) if g.table_id else None,
        table_label=g.table.label if g.table else None,
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
        display_name=body.display_name.strip(),
        tier=body.tier,
        table_id=table_id,
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
    if body.display_name is not None:
        guest.display_name = body.display_name.strip()
    if body.tier is not None:
        if body.tier not in ("full", "reception"):
            raise HTTPException(400, "tier must be 'full' or 'reception'")
        guest.tier = body.tier
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
    writer.writerow(["Name", "Display Name", "Tier", "Table"])
    for g in rows:
        writer.writerow([g.name, g.display_name, g.tier, g.table.label if g.table else ""])

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
