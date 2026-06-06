from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, ConfigDict, model_validator


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_id: int
    full_name: str


class AdminResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    created_at: datetime


# ── KYC Review ────────────────────────────────────────────────────────────────

class AdminUserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    full_name: str
    phone: str
    email: str
    nik: str | None
    date_of_birth: date | None
    rank: str
    xp: int


class AdminKYCListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user: AdminUserSummary
    ktp_image_url: str | None
    kk_image_url: str | None
    selfie_image_url: str | None
    bank_letter_url: str | None
    review_status: str
    rejection_reason: str | None
    reviewed_at: datetime | None
    updated_at: datetime


class KYCReviewRequest(BaseModel):
    decision: Literal["approved", "rejected"]
    rejection_reason: str | None = None

    @model_validator(mode="after")
    def require_reason_on_rejection(self) -> "KYCReviewRequest":
        if self.decision == "rejected" and not self.rejection_reason:
            raise ValueError("rejection_reason is required when rejecting KYC")
        return self


# ── Loan Review ───────────────────────────────────────────────────────────────

class AdminLoanListItem(BaseModel):
    id: int
    user_id: int
    user_full_name: str
    user_phone: str
    user_email: str
    user_rank: str
    user_xp: int
    annual_income: float | None
    emp_length: float | None
    loan_amnt: float
    loan_intent: str
    loan_grade: str
    loan_int_rate: float
    loan_percent_income: float
    tenure_months: int
    monthly_installment: float | None
    ml_score: int | None
    confidence: float | None
    loan_status: str
    review_status: str
    review_note: str | None
    reviewed_by: int | None
    reviewed_at: datetime | None
    created_at: datetime


class LoanReviewRequest(BaseModel):
    decision: Literal["approved", "rejected"]
    review_note: str | None = None

    @model_validator(mode="after")
    def require_note_on_rejection(self) -> "LoanReviewRequest":
        if self.decision == "rejected" and not self.review_note:
            raise ValueError("review_note is required when rejecting a loan")
        return self


# ── User List ─────────────────────────────────────────────────────────────────

class AdminUserListItem(BaseModel):
    id: int
    full_name: str
    phone: str
    email: str
    rank: str
    xp: int
    is_verified: bool
    kyc_status: str   # pending / approved / rejected / no_kyc
    created_at: datetime


class PaginatedUsers(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[AdminUserListItem]


# ── Dev God Mode ──────────────────────────────────────────────────────────────

class DevUserDetail(BaseModel):
    id: int
    full_name: str
    phone: str
    email: str
    rank: str
    xp: int
    is_verified: bool
    is_active: bool
    kyc_status: str
    default_on_file: str   # Y / N
    cred_hist_length: int
    created_at: datetime
    monthly_limit: int
    used_this_month: float
    remaining_this_month: float


class DevUserOverrideRequest(BaseModel):
    xp: int | None = None
    rank: str | None = None
    is_verified: bool | None = None
    is_active: bool | None = None
    kyc_status: str | None = None          # approved / rejected / pending
    default_on_file: str | None = None     # Y / N
    cred_hist_length: int | None = None
