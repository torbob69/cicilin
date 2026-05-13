from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_verified_user
from app.models.user import User
from app.schemas.quest import ActiveQuestsResponse
from app.services import quest_service

router = APIRouter(prefix="/quests", tags=["Quests"])


@router.get("/active", response_model=ActiveQuestsResponse)
def get_active_quests(
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return quest_service.get_active_quests(db, user)
