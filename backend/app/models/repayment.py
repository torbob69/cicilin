import uuid

from sqlalchemy import Column, Date, DateTime, Enum, Float, ForeignKey, String

from app.core.database import Base


class Repayment(Base):
    __tablename__ = "repayments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    loan_id = Column(String(36), ForeignKey("loan_applications.id"), nullable=False)
    due_date = Column(Date, nullable=False)
    amount = Column(Float, nullable=False)
    paid_at = Column(DateTime, nullable=True)
    status = Column(Enum("pending", "paid", "overdue"), default="pending")
    penalty = Column(Float, default=0)
