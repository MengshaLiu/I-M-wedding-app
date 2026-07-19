import asyncio
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_tier
from app.models import Photo
from app.schemas import GalleryResponse, PhotoOut
from app.services import images as img_svc
from app.services import storage

router = APIRouter(prefix="/api")

PER_PAGE = 20


@router.get("/moments", response_model=GalleryResponse)
async def list_gallery(
    page: int = 1,
    _tier: str = Depends(get_current_tier),
    db: AsyncSession = Depends(get_db),
):
    offset = (page - 1) * PER_PAGE
    rows = (
        await db.execute(
            select(Photo)
            .where(Photo.status == "visible")
            .order_by(Photo.created_at.desc())
            .offset(offset)
            .limit(PER_PAGE)
        )
    ).scalars().all()

    total = (
        await db.execute(
            select(func.count()).select_from(Photo).where(Photo.status == "visible")
        )
    ).scalar() or 0

    return GalleryResponse(
        photos=[
            PhotoOut(
                id=str(p.id),
                uploader_name=p.uploader_name,
                message=p.message,
                url=storage.public_url(p.storage_key),
                thumb_url=storage.public_url(p.thumb_key),
                created_at=p.created_at.isoformat(),
            )
            for p in rows
        ],
        total=total,
        page=page,
        per_page=PER_PAGE,
    )


@router.post("/moments", response_model=PhotoOut, status_code=201)
async def upload_photo(
    file: UploadFile = File(...),
    uploader_name: str = Form(...),
    message: str = Form(""),
    _tier: str = Depends(get_current_tier),
    db: AsyncSession = Depends(get_db),
):
    if file.content_type not in img_svc.ALLOWED_MIME:
        raise HTTPException(400, "Only JPEG, PNG, and WebP images are accepted")

    data = await file.read()
    loop = asyncio.get_event_loop()

    try:
        display_bytes, thumb_bytes = await loop.run_in_executor(
            None, img_svc.process, data
        )
    except ValueError as exc:
        raise HTTPException(400, str(exc))

    photo_id = uuid.uuid4()
    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    orig_ext = ext_map.get(file.content_type or "", "jpg")
    orig_key = f"photos/{photo_id}/original.{orig_ext}"
    disp_key = f"photos/{photo_id}/display.webp"
    thumb_key_str = f"photos/{photo_id}/thumb.webp"

    await loop.run_in_executor(
        None, lambda: storage.upload(orig_key, data, file.content_type or "image/jpeg")
    )
    await loop.run_in_executor(
        None, lambda: storage.upload(disp_key, display_bytes, "image/webp")
    )
    await loop.run_in_executor(
        None, lambda: storage.upload(thumb_key_str, thumb_bytes, "image/webp")
    )

    photo = Photo(
        id=photo_id,
        uploader_name=uploader_name.strip()[:120],
        message=message.strip()[:500] or None,
        storage_key=disp_key,
        thumb_key=thumb_key_str,
        original_key=orig_key,
        status="visible",
    )
    db.add(photo)
    await db.commit()
    await db.refresh(photo)

    return PhotoOut(
        id=str(photo.id),
        uploader_name=photo.uploader_name,
        message=photo.message,
        url=storage.public_url(disp_key),
        thumb_url=storage.public_url(thumb_key_str),
        created_at=photo.created_at.isoformat(),
    )


@router.delete("/moments/{photo_id}", status_code=204)
async def hide_photo(
    photo_id: str,
    _tier: str = Depends(get_current_tier),
    db: AsyncSession = Depends(get_db),
):
    try:
        pid = uuid.UUID(photo_id)
    except ValueError:
        raise HTTPException(400, "Invalid photo_id")

    photo = (await db.execute(select(Photo).where(Photo.id == pid))).scalar_one_or_none()
    if not photo:
        raise HTTPException(404, "Photo not found")

    photo.status = "hidden"
    await db.commit()
    return Response(status_code=204)
