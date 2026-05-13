from datetime import datetime
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class KYCDocument(Base):
    __tablename__ = "kyc_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True
    )
    ktp_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    kk_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    selfie_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    bank_letter_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    # pending / approved / rejected
    review_status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    reviewed_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("admins.id"), nullable=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="kyc_document")
    reviewer: Mapped["Admin | None"] = relationship("Admin", back_populates="reviewed_kyc")
