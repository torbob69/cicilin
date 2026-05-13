from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.user import (
    RegisterRequest,
    OTPVerifyRequest,
    LoginRequest,
    RefreshRequest,
    ResendOTPRequest,
    TokenResponse,
)
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register_user(db, data)


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    return auth_service.verify_otp(db, data.phone, data.code, data.purpose)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(db, data.phone, data.password)


@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, db: Session = Depends(get_db)):
    return auth_service.refresh_access_token(db, data.refresh_token)


@router.post("/resend-otp")
def resend_otp(data: ResendOTPRequest, db: Session = Depends(get_db)):
    return auth_service.resend_otp(db, data.phone)
