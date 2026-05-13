from datetime import date, datetime
from sqlalchemy import String, Integer, Boolean, Date, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    pin_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    nik: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True, index=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    # RENT / OWN / MORTGAGE / OTHER
    home_ownership: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # Years of credit history (ML feature)
    cb_person_cred_hist_length: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Gamification
    xp: Mapped[int] = mapped_column(Integer, default=700, nullable=False)
    rank: Mapped[str] = mapped_column(String(20), default="Gold", nullable=False)
    # Account state
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Relationships
    otp_tokens: Mapped[list["OTPToken"]] = relationship("OTPToken", back_populates="user")
    kyc_document: Mapped["KYCDocument | None"] = relationship(
        "KYCDocument", back_populates="user", uselist=False
    )
    employment: Mapped["UserEmployment | None"] = relationship(
        "UserEmployment", back_populates="user", uselist=False
    )
    bank_accounts: Mapped[list["BankAccount"]] = relationship("BankAccount", back_populates="user")
    loan_applications: Mapped[list["LoanApplication"]] = relationship(
        "LoanApplication", back_populates="user"
    )
    credit_history: Mapped["CreditHistory | None"] = relationship(
        "CreditHistory", back_populates="user", uselist=False
    )
    xp_events: Mapped[list["XPEvent"]] = relationship("XPEvent", back_populates="user")
    quest_progress: Mapped[list["UserQuestProgress"]] = relationship(
        "UserQuestProgress", back_populates="user"
    )
