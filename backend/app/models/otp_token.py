import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, func

from app.core.database import Base


class OTPToken(Base):
    __tablename__ = "otp_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    code = Column(String(6), nullable=False)
    purpose = Column(Enum("registration", "loan_acceptance"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
