import uuid

from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func

from app.core.database import Base


class LoanApplication(Base):
    __tablename__ = "loan_applications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    loan_amnt = Column(Float, nullable=False)
    loan_intent = Column(
        Enum("PERSONAL", "EDUCATION", "MEDICAL", "VENTURE", "HOMEIMPROVEMENT", "DEBTCONSOLIDATION"),
        nullable=False,
    )
    loan_grade = Column(String(1), nullable=True)
    loan_int_rate = Column(Float, nullable=True)
    loan_percent_income = Column(Float, nullable=True)
    tenure_months = Column(Integer, nullable=False)

    ml_score = Column(Integer, nullable=True)
    confidence = Column(Float, nullable=True)

    loan_status = Column(
        Enum("pending", "scoring", "approved", "rejected", "manual_review", "disbursed", "closed"),
        default="pending",
    )

    reviewed_by = Column(String(36), ForeignKey("admins.id"), nullable=True)
    review_status = Column(
        Enum("not_required", "pending", "approved", "rejected"),
        default="not_required",
    )
    review_note = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    disbursed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
