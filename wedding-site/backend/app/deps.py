from fastapi import Depends, HTTPException, Request
from jose import JWTError, jwt

from app.config import settings


def _extract_bearer(req: Request) -> str:
    auth = req.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth.removeprefix("Bearer ")
    raise HTTPException(status_code=401, detail="Missing session token")


async def get_current_tier(req: Request) -> str:
    token = _extract_bearer(req)
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    tier = payload.get("tier")
    if tier not in ("full", "reception"):
        raise HTTPException(status_code=401, detail="Invalid tier in session")
    return tier


def require_full_tier(tier: str = Depends(get_current_tier)) -> str:
    if tier != "full":
        raise HTTPException(status_code=403, detail="Full guests only")
    return tier
