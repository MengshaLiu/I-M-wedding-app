from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from jose import jwt

from app.config import settings
from app.schemas import SessionRequest, SessionResponse

router = APIRouter(prefix="/api")

_TOKEN_TIER_MAP = {
    settings.invite_token_full: "full",
    settings.invite_token_reception: "reception",
}


@router.post("/session", response_model=SessionResponse)
async def create_session(body: SessionRequest):
    tier = _TOKEN_TIER_MAP.get(body.token)
    if tier is None:
        raise HTTPException(status_code=401, detail="Invalid invite code")

    now = datetime.now(tz=timezone.utc)
    payload = {
        "tier": tier,
        "iat": now,
        "exp": now + timedelta(days=30),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return SessionResponse(jwt=token, tier=tier)
