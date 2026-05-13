from datetime import datetime
from sqlalchemy import String, Integer, DateTime, JSON, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class MonthlyQuest(Base):
    """Stores which 5 quest IDs are active for a given year/month."""

    __tablename__ = "monthly_quests"
    __table_args__ = (UniqueConstraint("year", "month", name="uq_monthly_quests_year_month"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    # JSON array of 5 quest IDs, e.g. [1, 5, 12, 17, 20]
    quest_ids: Mapped[list] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
