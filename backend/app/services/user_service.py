from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.security import hash_pin, verify_pin
from app.models.bank_account import BankAccount
from app.models.kyc_document import KYCDocument
from app.models.user import User
from app.models.user_employment import UserEmployment
from app.models.xp_event import XPEvent
from app.schemas.quest import XPEventResponse
from app.schemas.user import (
    BankAccountCreateRequest,
    BankAccountResponse,
    EmploymentResponse,
    EmploymentUpsertRequest,
    KYCStatusResponse,
    KYCUploadResponse,
    ProfileUpdateRequest,
    RankResponse,
    UserProfileResponse,
)
from app.services.cloudinary_service import upload_image

# Grade, limits and rates indexed by rank name
_RANK_CONFIG: dict[str, dict] = {
    "Ruby":     {"grade": "A", "monthly_limit": 100_000_000, "interest_rate": 6.0,  "xp_next": None},
    "Diamond":  {"grade": "B", "monthly_limit": 50_000_000,  "interest_rate": 9.0,  "xp_next": 2000},
    "Platinum": {"grade": "C", "monthly_limit": 25_000_000,  "interest_rate": 12.0, "xp_next": 1500},
    "Gold":     {"grade": "D", "monthly_limit": 10_000_000,  "interest_rate": 15.0, "xp_next": 1000},
    "Silver":   {"grade": "E", "monthly_limit": 5_000_000,   "interest_rate": 18.0, "xp_next": 600},
    "Bronze":   {"grade": "F", "monthly_limit": 2_000_000,   "interest_rate": 24.0, "xp_next": 300},
    "Iron":     {"grade": "G", "monthly_limit": 0,           "interest_rate": 0.0,  "xp_next": 100},
}

_KYC_FIELD_MAP = {
    "ktp":         "ktp_image_url",
    "kk":          "kk_image_url",
    "selfie":      "selfie_image_url",
    "bank_letter": "bank_letter_url",
}


# ── Profile ───────────────────────────────────────────────────────────────────

def get_profile(user: User) -> UserProfileResponse:
    return UserProfileResponse.model_validate(user)


_ALLOWED_PROFILE_FIELDS = {"full_name", "nik", "date_of_birth", "address", "home_ownership", "cb_person_cred_hist_length"}

def update_profile(db: Session, user: User, data: ProfileUpdateRequest) -> UserProfileResponse:
    for key, value in data.model_dump(exclude_none=True).items():
        if key in _ALLOWED_PROFILE_FIELDS:
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return UserProfileResponse.model_validate(user)


def set_pin(db: Session, user: User, pin: str) -> dict:
    user.pin_hash = hash_pin(pin)
    db.commit()
    return {"message": "PIN set successfully"}


def change_pin(db: Session, user: User, current_pin: str, new_pin: str) -> dict:
    if not user.pin_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PIN belum diatur. Gunakan fitur set-pin terlebih dahulu.")
    if not verify_pin(current_pin, user.pin_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PIN saat ini tidak valid")
    user.pin_hash = hash_pin(new_pin)
    db.commit()
    return {"message": "PIN berhasil diubah"}


# ── KYC ──────────────────────────────────────────────────────────────────────

def get_kyc_status(db: Session, user: User) -> KYCStatusResponse:
    kyc = db.query(KYCDocument).filter(KYCDocument.user_id == user.id).first()
    if not kyc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KYC record not found")
    return KYCStatusResponse.model_validate(kyc)


def upload_kyc_document(
    db: Session, user: User, file: UploadFile, doc_type: str
) -> KYCUploadResponse:
    kyc = db.query(KYCDocument).filter(KYCDocument.user_id == user.id).first()
    if not kyc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KYC record not found")

    url = upload_image(file, folder=f"cicilin/kyc/{user.id}", public_id=doc_type)

    setattr(kyc, _KYC_FIELD_MAP[doc_type], url)
    kyc.review_status = "pending"
    kyc.rejection_reason = None
    kyc.reviewed_at = None
    kyc.verified_at = None
    db.commit()

    return KYCUploadResponse(document_type=doc_type, url=url, review_status="pending")


# ── Employment ────────────────────────────────────────────────────────────────

def get_employment(db: Session, user: User) -> EmploymentResponse:
    emp = db.query(UserEmployment).filter(UserEmployment.user_id == user.id).first()
    if not emp:
        return EmploymentResponse(occupation=None, employer_name=None, job_title=None, emp_length=None, annual_income=None)
    return EmploymentResponse.model_validate(emp)


def upsert_employment(
    db: Session, user: User, data: EmploymentUpsertRequest
) -> EmploymentResponse:
    emp = db.query(UserEmployment).filter(UserEmployment.user_id == user.id).first()
    if not emp:
        emp = UserEmployment(user_id=user.id)
        db.add(emp)

    for key, value in data.model_dump(exclude_none=True).items():
        setattr(emp, key, value)

    db.commit()
    db.refresh(emp)
    return EmploymentResponse.model_validate(emp)


# ── Bank Accounts ─────────────────────────────────────────────────────────────

def add_bank_account(
    db: Session, user: User, data: BankAccountCreateRequest
) -> BankAccountResponse:
    if data.is_primary:
        db.query(BankAccount).filter(
            BankAccount.user_id == user.id,
            BankAccount.is_primary.is_(True),
        ).update({"is_primary": False})

    account = BankAccount(
        user_id=user.id,
        bank_name=data.bank_name,
        account_number=data.account_number,
        account_holder_name=data.account_holder_name,
        is_primary=data.is_primary,
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return BankAccountResponse.model_validate(account)


def list_bank_accounts(db: Session, user: User) -> list[BankAccountResponse]:
    accounts = (
        db.query(BankAccount)
        .filter(BankAccount.user_id == user.id)
        .order_by(BankAccount.is_primary.desc(), BankAccount.created_at)
        .all()
    )
    return [BankAccountResponse.model_validate(a) for a in accounts]


# ── Rank ──────────────────────────────────────────────────────────────────────

def get_rank(db: Session, user: User) -> RankResponse:
    cfg = _RANK_CONFIG.get(user.rank, _RANK_CONFIG["Iron"])
    xp_next = cfg["xp_next"]
    xp_to_next = max(0, xp_next - user.xp) if xp_next is not None else None
    events = (
        db.query(XPEvent)
        .filter(XPEvent.user_id == user.id)
        .order_by(XPEvent.created_at.desc())
        .limit(20)
        .all()
    )
    return RankResponse(
        rank=user.rank,
        xp=user.xp,
        loan_grade=cfg["grade"],
        monthly_limit=cfg["monthly_limit"],
        interest_rate=cfg["interest_rate"],
        xp_to_next_rank=xp_to_next,
        xp_events=[XPEventResponse.model_validate(e) for e in events],
    )
