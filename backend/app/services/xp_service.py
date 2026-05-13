from sqlalchemy.orm import Session

from app.models.user import User
from app.models.xp_event import XPEvent

# XP threshold boundaries — descending order for first-match lookup
_XP_THRESHOLDS: list[tuple[int, str]] = [
    (2000, "Ruby"),
    (1500, "Diamond"),
    (1000, "Platinum"),
    (600,  "Gold"),
    (300,  "Silver"),
    (100,  "Bronze"),
    (0,    "Iron"),
]


def recalculate_rank(user: User) -> None:
    """Update user.rank based on current XP. Does not flush/commit."""
    for threshold, rank in _XP_THRESHOLDS:
        if user.xp >= threshold:
            user.rank = rank
            return


def add_xp(db: Session, user: User, delta: int, reason: str) -> None:
    """
    Apply an XP delta to the user, recalculate rank, and log the event.
    Does NOT commit — caller is responsible for committing.
    """
    user.xp = max(0, user.xp + delta)
    recalculate_rank(user)
    db.add(XPEvent(
        user_id=user.id,
        delta=delta,
        reason=reason,
        xp_after=user.xp,
    ))
