from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class UserEmployment(Base):
    __tablename__ = "user_employment"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True
    )
    occupation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    employer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    # Years of employment (ML feature: person_emp_length)
    emp_length: Mapped[float | None] = mapped_column(Numeric(5, 1), nullable=True)
    # Annual income in IDR (ML feature: person_income)
    annual_income: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="employment")
