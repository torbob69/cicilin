from sqlalchemy.orm import Session

from app.core.constants import XP_THRESHOLDS
from app.models.user import User
from app.models.xp_event import XPEvent


def recalculate_rank(user: User) -> None:
    for threshold, rank in XP_THRESHOLDS:
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
