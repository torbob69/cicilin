import time

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.quest import LeaderboardEntryResponse

_cache: list[LeaderboardEntryResponse] = []
_cache_ts: float = 0.0
_TTL: float = 86400.0  # 24 hours in seconds


def get_leaderboard(db: Session, limit: int = 50) -> list[LeaderboardEntryResponse]:
    global _cache, _cache_ts
    now = time.monotonic()
    if _cache and (now - _cache_ts) < _TTL:
        return _cache

    users = db.query(User).order_by(User.xp.desc()).limit(limit).all()
    result = [
        LeaderboardEntryResponse(
            rank_position=i + 1,
            user_id=u.id,
            full_name=u.full_name,
            xp=u.xp,
            rank=u.rank,
        )
        for i, u in enumerate(users)
    ]
    _cache = result
    _cache_ts = now
    return result


def invalidate_cache() -> None:
    global _cache, _cache_ts
    _cache = []
    _cache_ts = 0.0
