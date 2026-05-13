import random
import string
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    create_admin_token,
    decode_token,
)
from app.models.user import User
from app.models.admin import Admin
from app.models.otp_token import OTPToken
from app.models.credit_history import CreditHistory
from app.models.kyc_document import KYCDocument
from app.schemas.user import RegisterRequest, TokenResponse
from app.schemas.admin import AdminTokenResponse


# ── OTP ───────────────────────────────────────────────────────────────────────

def _generate_otp_code() -> str:
    return "".join(random.choices(string.digits, k=6))


def _normalize_phone_for_fonnte(phone: str) -> str:
    """Convert 08xx or +628xx → 628xx for Fonnte API."""
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        return phone[1:]
    if phone.startswith("0"):
        return "62" + phone[1:]
    return phone


def send_otp_whatsapp(phone: str, code: str) -> bool:
    if settings.is_development:
        print(f"\n{'='*40}")
        print(f"  [DEV OTP]  Phone : {phone}")
        print(f"  [DEV OTP]  Code  : {code}")
        print(f"{'='*40}\n")
        return True

    normalized = _normalize_phone_for_fonnte(phone)
    message = (
        f"Kode OTP Cicilin kamu adalah: *{code}*\n"
        f"Berlaku 5 menit. Jangan bagikan kode ini kepada siapapun."
    )
    try:
        r = httpx.post(
            "https://api.fonnte.com/send",
            headers={"Authorization": settings.FONNTE_API_KEY},
            data={"target": normalized, "message": message, "countryCode": "62"},
            timeout=10,
        )
        return r.status_code == 200
    except Exception as e:
        print(f"[OTP] Fonnte send failed: {e}")
        return False


def generate_and_send_otp(db: Session, user: User, purpose: str) -> None:
    # Invalidate any existing unused OTPs for same purpose
    db.query(OTPToken).filter(
        OTPToken.user_id == user.id,
        OTPToken.purpose == purpose,
        OTPToken.used_at.is_(None),
    ).delete()

    code = _generate_otp_code()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)

    otp = OTPToken(
        user_id=user.id,
        code=code,
        purpose=purpose,
        expires_at=expires_at,
    )
    db.add(otp)
    db.commit()

    send_otp_whatsapp(user.phone, code)


# ── Register ──────────────────────────────────────────────────────────────────

def register_user(db: Session, data: RegisterRequest) -> dict:
    if db.query(User).filter(User.phone == data.phone).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number already registered")

    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        phone=data.phone,
        email=str(data.email),
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        xp=700,
        rank="Gold",
        is_active=True,
        is_verified=False,
    )
    db.add(user)
    db.flush()  # get user.id before commit

    # Bootstrap credit history
    db.add(CreditHistory(user_id=user.id, default_on_file="N", cred_hist_length=0))

    # Bootstrap KYC document record (all URLs null, status pending)
    db.add(KYCDocument(user_id=user.id, review_status="pending"))

    db.commit()
    db.refresh(user)

    generate_and_send_otp(db, user, purpose="registration")

    return {"message": "Registration successful. OTP sent to your WhatsApp.", "user_id": user.id}


# ── Verify OTP ────────────────────────────────────────────────────────────────

def verify_otp(db: Session, phone: str, code: str, purpose: str) -> TokenResponse:
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    now = datetime.now(timezone.utc)
    otp = (
        db.query(OTPToken)
        .filter(
            OTPToken.user_id == user.id,
            OTPToken.purpose == purpose,
            OTPToken.used_at.is_(None),
        )
        .order_by(OTPToken.created_at.desc())
        .first()
    )

    if not otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active OTP found")

    otp_expires = otp.expires_at
    if otp_expires.tzinfo is None:
        otp_expires = otp_expires.replace(tzinfo=timezone.utc)

    if now > otp_expires:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired")

    if otp.code != code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code")

    # Mark OTP as used
    otp.used_at = datetime.now(timezone.utc)

    if purpose == "registration":
        user.is_verified = True

    db.commit()

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


# ── Verify OTP inline (no token issued — for mid-flow checks) ────────────────

def verify_otp_inline(db: Session, user: User, code: str, purpose: str) -> None:
    """Verify OTP for a known user without issuing tokens. Marks OTP used. Does NOT commit."""
    now = datetime.now(timezone.utc)
    otp = (
        db.query(OTPToken)
        .filter(
            OTPToken.user_id == user.id,
            OTPToken.purpose == purpose,
            OTPToken.used_at.is_(None),
        )
        .order_by(OTPToken.created_at.desc())
        .first()
    )
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active OTP found. Please request a new one.",
        )
    otp_expires = otp.expires_at
    if otp_expires.tzinfo is None:
        otp_expires = otp_expires.replace(tzinfo=timezone.utc)
    if now > otp_expires:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired")
    if otp.code != code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP code")
    otp.used_at = now


# ── Resend OTP ────────────────────────────────────────────────────────────────

def resend_otp(db: Session, phone: str) -> dict:
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone already verified.",
        )
    generate_and_send_otp(db, user, purpose="registration")
    return {"message": "OTP resent to your WhatsApp."}


# ── Login ─────────────────────────────────────────────────────────────────────

def login(db: Session, phone: str, password: str) -> TokenResponse:
    user = db.query(User).filter(User.phone == phone).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Phone not verified. Please complete OTP verification.",
        )

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


# ── Refresh Token ─────────────────────────────────────────────────────────────

def refresh_access_token(db: Session, refresh_token: str) -> TokenResponse:
    from jose import JWTError

    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
    )


# ── Admin Login ───────────────────────────────────────────────────────────────

def admin_login(db: Session, email: str, password: str) -> AdminTokenResponse:
    admin = db.query(Admin).filter(Admin.email == email).first()
    if not admin or not verify_password(password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    return AdminTokenResponse(
        access_token=create_admin_token(admin.id),
        admin_id=admin.id,
        full_name=admin.full_name,
    )
