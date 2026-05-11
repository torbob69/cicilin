import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text

from app.core.database import Base


class KYCDocument(Base):
    __tablename__ = "kyc_documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    ktp_image_url = Column(String(500), nullable=True)
    selfie_image_url = Column(String(500), nullable=True)
    review_status = Column(Enum("pending", "approved", "rejected"), default="pending")
    reviewed_by = Column(String(36), ForeignKey("admins.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
