import uuid

from sqlalchemy import Column, DateTime, String, func

from app.core.database import Base


class Admin(Base):
    __tablename__ = "admins"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
