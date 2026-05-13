from datetime import datetime
from pydantic import BaseModel, ConfigDict


class XPEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    delta: int
    reason: str
    xp_after: int
    created_at: datetime


class LeaderboardEntryResponse(BaseModel):
    rank_position: int
    user_id: int
    full_name: str
    xp: int
    rank: str


class QuestResponse(BaseModel):
    quest_id: int
    title: str
    xp_reward: int
    completed: bool
    completed_at: datetime | None


class ActiveQuestsResponse(BaseModel):
    year: int
    month: int
    quests: list[QuestResponse]
