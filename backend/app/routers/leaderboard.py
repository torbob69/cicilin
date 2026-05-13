from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.quest import LeaderboardEntryResponse
from app.services import leaderboard_service

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])


@router.get("", response_model=list[LeaderboardEntryResponse])
def get_leaderboard(
    limit: int = Query(default=50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return leaderboard_service.get_leaderboard(db, limit)
