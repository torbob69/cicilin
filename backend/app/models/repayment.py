from datetime import date, datetime
from sqlalchemy import String, Integer, DateTime, Date, ForeignKey, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Repayment(Base):
    __tablename__ = "repayments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    loan_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("loan_applications.id"), nullable=False, index=True
    )
    installment_number: Mapped[int] = mapped_column(Integer, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    penalty: Mapped[float] = mapped_column(Numeric(15, 2), default=0, nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # pending / paid / overdue / waived
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    # Midtrans order ID for tracking payment attempts
    midtrans_order_id: Mapped[str | None] = mapped_column(String(100), nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    loan: Mapped["LoanApplication"] = relationship("LoanApplication", back_populates="repayments")
