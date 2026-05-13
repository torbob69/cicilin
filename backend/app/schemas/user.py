from datetime import datetime
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
