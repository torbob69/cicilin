import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, func

from app.core.database import Base


class CreditHistory(Base):
    __tablename__ = "credit_history"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    default_on_file = Column(Enum("Y", "N"), default="N")
    cred_hist_length = Column(Integer, default=0)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
