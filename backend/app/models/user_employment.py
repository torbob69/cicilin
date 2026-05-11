import uuid

from sqlalchemy import Column, Float, ForeignKey, String

from app.core.database import Base


class UserEmployment(Base):
    __tablename__ = "user_employment"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    employer_name = Column(String(255), nullable=True)
    emp_length = Column(Float, nullable=True)
    annual_income = Column(Float, nullable=True)
    job_title = Column(String(255), nullable=True)
