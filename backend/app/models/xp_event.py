from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class XPEvent(Base):
    __tablename__ = "xp_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    # Positive = gain, negative = loss/drain
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    # e.g. "pay_on_time", "pay_early", "full_repay", "late_7d", "daily_drain", "quest_complete"
    reason: Mapped[str] = mapped_column(String(50), nullable=False)
    # XP value after this event (snapshot for history display)
    xp_after: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="xp_events")
