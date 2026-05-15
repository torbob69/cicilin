from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_verified_user
from app.models.user import User
from app.schemas.user import (
    BankAccountCreateRequest,
    BankAccountResponse,
    EmploymentResponse,
    EmploymentUpsertRequest,
    KYCStatusResponse,
    KYCUploadResponse,
    ProfileUpdateRequest,
    RankResponse,
    SetPinRequest,
    UserProfileResponse,
)
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


# ── Profile ───────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserProfileResponse)
def get_me(user: User = Depends(get_verified_user)):
    return user_service.get_profile(user)


@router.put("/me", response_model=UserProfileResponse)
def update_me(
    data: ProfileUpdateRequest,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.update_profile(db, user, data)


@router.post("/me/set-pin")
def set_pin(
    data: SetPinRequest,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.set_pin(db, user, data.pin)


@router.get("/me/rank", response_model=RankResponse)
def get_rank(
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.get_rank(db, user)


# ── KYC ──────────────────────────────────────────────────────────────────────

@router.get("/kyc/status", response_model=KYCStatusResponse)
def get_kyc_status(
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.get_kyc_status(db, user)


@router.post("/kyc/upload-ktp", response_model=KYCUploadResponse)
def upload_ktp(
    file: UploadFile = File(...),
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.upload_kyc_document(db, user, file, "ktp")


@router.post("/kyc/upload-kk", response_model=KYCUploadResponse)
def upload_kk(
    file: UploadFile = File(...),
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.upload_kyc_document(db, user, file, "kk")


@router.post("/kyc/upload-selfie", response_model=KYCUploadResponse)
def upload_selfie(
    file: UploadFile = File(...),
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.upload_kyc_document(db, user, file, "selfie")


@router.post("/kyc/upload-bank-letter", response_model=KYCUploadResponse)
def upload_bank_letter(
    file: UploadFile = File(...),
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.upload_kyc_document(db, user, file, "bank_letter")


# ── Employment ────────────────────────────────────────────────────────────────

@router.get("/employment", response_model=EmploymentResponse)
def get_employment(
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.get_employment(db, user)


@router.put("/employment", response_model=EmploymentResponse)
def upsert_employment(
    data: EmploymentUpsertRequest,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.upsert_employment(db, user, data)


# ── Bank Accounts ─────────────────────────────────────────────────────────────

@router.post("/bank-account", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
def add_bank_account(
    data: BankAccountCreateRequest,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.add_bank_account(db, user, data)


@router.get("/bank-accounts", response_model=list[BankAccountResponse])
def list_bank_accounts(
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return user_service.list_bank_accounts(db, user)
