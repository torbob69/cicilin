from datetime import date, datetime
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict


# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    phone: str
    email: EmailStr
    password: str
    full_name: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        digits = v.replace("+", "").replace("-", "").replace(" ", "")
        if not digits.isdigit() or len(digits) < 9 or len(digits) > 15:
            raise ValueError("Phone number is not valid")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Full name is too short")
        return v.strip()


class OTPVerifyRequest(BaseModel):
    phone: str
    code: str
    # registration / login / accept_offer
    purpose: str

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("OTP code must be 6 digits")
        return v


class LoginRequest(BaseModel):
    phone: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ── User Profile ──────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    email: str
    full_name: str
    rank: str
    xp: int
    is_verified: bool
    created_at: datetime


class ProfileUpdateRequest(BaseModel):
    address: str | None = None
    home_ownership: str | None = None
    cb_person_cred_hist_length: int | None = None

    @field_validator("home_ownership")
    @classmethod
    def validate_home_ownership(cls, v: str | None) -> str | None:
        if v is not None and v not in ("RENT", "OWN", "MORTGAGE", "OTHER"):
            raise ValueError("home_ownership must be RENT, OWN, MORTGAGE, or OTHER")
        return v


class SetPinRequest(BaseModel):
    pin: str

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("PIN must be exactly 6 digits")
        return v


# ── User Profile (full) ───────────────────────────────────────────────────────

class UserProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    email: str
    full_name: str
    nik: str | None
    date_of_birth: date | None
    address: str | None
    home_ownership: str | None
    cb_person_cred_hist_length: int | None
    rank: str
    xp: int
    is_verified: bool
    created_at: datetime


# ── KYC ──────────────────────────────────────────────────────────────────────

class KYCStatusResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ktp_image_url: str | None
    kk_image_url: str | None
    selfie_image_url: str | None
    bank_letter_url: str | None
    review_status: str
    rejection_reason: str | None
    reviewed_at: datetime | None


class KYCUploadResponse(BaseModel):
    document_type: str
    url: str
    review_status: str


# ── Employment ────────────────────────────────────────────────────────────────

class EmploymentUpsertRequest(BaseModel):
    occupation: str | None = None
    employer_name: str | None = None
    job_title: str | None = None
    emp_length: float | None = None
    annual_income: float | None = None

    @field_validator("emp_length")
    @classmethod
    def validate_emp_length(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("Employment length cannot be negative")
        return v

    @field_validator("annual_income")
    @classmethod
    def validate_annual_income(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("Annual income must be positive")
        return v


class EmploymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    occupation: str | None
    employer_name: str | None
    job_title: str | None
    emp_length: float | None
    annual_income: float | None


# ── Bank Account ──────────────────────────────────────────────────────────────

class BankAccountCreateRequest(BaseModel):
    bank_name: str
    account_number: str
    account_holder_name: str
    is_primary: bool = False

    @field_validator("account_number")
    @classmethod
    def validate_account_number(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned.isdigit():
            raise ValueError("Account number must contain digits only")
        return cleaned


class BankAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    bank_name: str
    account_number: str
    account_holder_name: str
    is_primary: bool
    created_at: datetime


# ── Rank ──────────────────────────────────────────────────────────────────────

class RankResponse(BaseModel):
    rank: str
    xp: int
    loan_grade: str
    monthly_limit: int
    interest_rate: float
    xp_to_next_rank: int | None
