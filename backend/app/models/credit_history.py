from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class CreditHistory(Base):
    __tablename__ = "credit_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True
    )
    # Y / N  (ML feature: cb_person_default_on_file)
    default_on_file: Mapped[str] = mapped_column(String(1), default="N", nullable=False)
    # ML feature: cb_person_cred_hist_length (also stored in users for quick access)
    cred_hist_length: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="credit_history")
