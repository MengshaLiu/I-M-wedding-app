import io

from PIL import Image, ImageOps, UnidentifiedImageError

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 10 * 1024 * 1024  # 10 MB
DISPLAY_MAX = 1920
THUMB_MAX = 800


def process(data: bytes) -> tuple[bytes, bytes]:
    """Validate image data and return (display_webp, thumb_webp).
    Raises ValueError on invalid input."""
    if len(data) > MAX_BYTES:
        raise ValueError("File too large (max 10 MB)")

    try:
        img = Image.open(io.BytesIO(data))
        img.load()
    except UnidentifiedImageError:
        raise ValueError("Not a recognised image format")

    img = ImageOps.exif_transpose(img)

    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    display = img.copy()
    display.thumbnail((DISPLAY_MAX, DISPLAY_MAX), Image.LANCZOS)
    disp_buf = io.BytesIO()
    display.save(disp_buf, format="WEBP", quality=85, method=4)

    thumb = img.copy()
    thumb.thumbnail((THUMB_MAX, THUMB_MAX), Image.LANCZOS)
    thumb_buf = io.BytesIO()
    thumb.save(thumb_buf, format="WEBP", quality=85, method=4)

    return disp_buf.getvalue(), thumb_buf.getvalue()
