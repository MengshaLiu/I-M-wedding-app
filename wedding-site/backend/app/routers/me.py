from fastapi import APIRouter, Depends

from app.deps import get_current_tier
from app.schemas import MeResponse

router = APIRouter(prefix="/api")


@router.get("/me", response_model=MeResponse)
async def me(tier: str = Depends(get_current_tier)):
    return MeResponse(tier=tier)
