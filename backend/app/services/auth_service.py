import random
import string
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
from app.models.otp_token import OTPToken
from app.models.user import User
from app.schemas.user import UserRegister


def register_user(data: UserRegister, db: Session) -> dict:
    existing_email = db.query(User).filter(User.email == data.email).first()
    existing_phone = db.query(User).filter(User.phone == data.phone).first()

    # allow re-registration if previous attempt was never verified
    if existing_email and existing_email.is_verified:
        raise HTTPException(status_code=400, detail="Email already registered")
    if existing_phone and existing_phone.is_verified:
        raise HTTPException(status_code=400, detail="Phone already registered")

    # reuse or create user record
    user = existing_email or existing_phone
    if user:
        user.phone = data.phone
        user.email = data.email
        user.password_hash = hash_password(data.password)
        user.full_name = data.full_name
    else:
        user = User(
            phone=data.phone,
            email=data.email,
            password_hash=hash_password(data.password),
            full_name=data.full_name,
        )
        db.add(user)

    db.flush()
    otp = _create_otp(user.id, "registration", db)
    db.commit()

    return {"message": "OTP sent to your phone", "dev_otp": otp.code}


def verify_otp(phone: str, code: str, db: Session) -> dict:
    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    otp = (
        db.query(OTPToken)
        .filter(
            OTPToken.user_id == user.id,
            OTPToken.code == code,
            OTPToken.purpose == "registration",
            OTPToken.used_at.is_(None),
        )
        .first()
    )
    if not otp or otp.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    otp.used_at = datetime.now(timezone.utc).replace(tzinfo=None)
    user.is_verified = True
    db.commit()

    return {
        "access_token": create_access_token(user.id, role="user"),
        "refresh_token": create_refresh_token(user.id, role="user"),
        "token_type": "bearer",
    }


def login_user(email: str, password: str, db: Session) -> dict:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Account not verified. Please complete OTP verification.")

    return {
        "access_token": create_access_token(user.id, role="user"),
        "refresh_token": create_refresh_token(user.id, role="user"),
        "token_type": "bearer",
    }


def _create_otp(user_id: str, purpose: str, db: Session) -> OTPToken:
    code = "".join(random.choices(string.digits, k=6))
    otp = OTPToken(
        user_id=user_id,
        code=code,
        purpose=purpose,
        expires_at=datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5),
    )
    db.add(otp)
    return otp
