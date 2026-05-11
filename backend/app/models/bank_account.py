import uuid

from sqlalchemy import Column, ForeignKey, String

from app.core.database import Base


class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    bank_name = Column(String(255), nullable=False)
    account_number = Column(String(50), nullable=False)
    account_holder_name = Column(String(255), nullable=False)
