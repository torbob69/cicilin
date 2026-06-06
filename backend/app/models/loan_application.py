from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Numeric, Float, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Loan parameters
    loan_amnt: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    # PERSONAL / EDUCATION / MEDICAL / VENTURE / HOMEIMPROVEMENT / DEBTCONSOLIDATION
    loan_intent: Mapped[str] = mapped_column(String(30), nullable=False)
    # A / B / C / D / E / F / G  (derived from user rank at time of application)
    loan_grade: Mapped[str] = mapped_column(String(2), nullable=False)
    loan_int_rate: Mapped[float] = mapped_column(Float, nullable=False)
    loan_percent_income: Mapped[float] = mapped_column(Float, nullable=False)
    tenure_months: Mapped[int] = mapped_column(Integer, nullable=False)
    monthly_installment: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)

    # ML output
    ml_score: Mapped[int | None] = mapped_column(Integer, nullable=True)       # 0 or 1
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    shap_explanation: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status
    # pending / scoring / approved / rejected / manual_review / disbursed / closed
    loan_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)

    # Admin manual review (when confidence < 0.75)
    reviewed_by: Mapped[int | None] = mapped_column(Integer, ForeignKey("admins.id"), nullable=True)
    # not_required / pending / approved / rejected
    review_status: Mapped[str] = mapped_column(String(20), default="not_required", nullable=False)
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    disbursed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="loan_applications")
    reviewer: Mapped["Admin | None"] = relationship("Admin", back_populates="reviewed_loans")
    repayments: Mapped[list["Repayment"]] = relationship("Repayment", back_populates="loan")
