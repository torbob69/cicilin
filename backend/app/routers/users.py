from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.bank_account import BankAccount
from app.models.kyc_document import KYCDocument
from app.models.user import User
from app.models.user_employment import UserEmployment
from app.schemas.user import BankAccountCreate, BankAccountResponse, EmploymentCreate, EmploymentResponse, UserResponse, UserUpdate
from app.services.cloudinary_service import upload_image

router = APIRouter(prefix="/users", tags=["Users"])


def _build_user_response(user: User, db: Session) -> UserResponse:
    employment = db.query(UserEmployment).filter(UserEmployment.user_id == user.id).first()
    return UserResponse(
        id=user.id,
        phone=user.phone,
        email=user.email,
        full_name=user.full_name,
        nik=user.nik,
        date_of_birth=user.date_of_birth,
        address=user.address,
        home_ownership=user.home_ownership,
        created_at=user.created_at,
        employment=EmploymentResponse.model_validate(employment) if employment else None,
    )


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _build_user_response(user, db)


@router.put("/me", response_model=UserResponse)
def update_me(data: UserUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return _build_user_response(user, db)


@router.post("/employment")
def update_employment(data: EmploymentCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    employment = db.query(UserEmployment).filter(UserEmployment.user_id == user.id).first()
    if employment:
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(employment, field, value)
    else:
        employment = UserEmployment(user_id=user.id, **data.model_dump())
        db.add(employment)
    db.commit()
    return {"message": "Employment info updated"}


@router.post("/kyc/upload-ktp")
async def upload_ktp(file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    content = await file.read()
    url = upload_image(content, folder="kyc/ktp", public_id=f"ktp_{user.id}")

    kyc = db.query(KYCDocument).filter(KYCDocument.user_id == user.id).first()
    if not kyc:
        kyc = KYCDocument(user_id=user.id)
        db.add(kyc)
    kyc.ktp_image_url = url
    kyc.review_status = "pending"
    db.commit()
    return {"ktp_image_url": url}


@router.post("/kyc/upload-selfie")
async def upload_selfie(file: UploadFile = File(...), user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    content = await file.read()
    url = upload_image(content, folder="kyc/selfie", public_id=f"selfie_{user.id}")

    kyc = db.query(KYCDocument).filter(KYCDocument.user_id == user.id).first()
    if not kyc:
        kyc = KYCDocument(user_id=user.id)
        db.add(kyc)
    kyc.selfie_image_url = url
    db.commit()
    return {"selfie_image_url": url}


@router.post("/dev/approve-kyc")
def dev_approve_kyc(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if settings.APP_ENV != "development":
        raise HTTPException(status_code=403, detail="Only available in development")
    kyc = db.query(KYCDocument).filter(KYCDocument.user_id == user.id).first()
    if not kyc:
        kyc = KYCDocument(user_id=user.id)
        db.add(kyc)
    kyc.ktp_image_url = "dev_placeholder"
    kyc.selfie_image_url = "dev_placeholder"
    kyc.review_status = "approved"
    db.commit()
    return {"message": "KYC approved (dev mode)"}


@router.post("/bank-account", response_model=BankAccountResponse)
def add_bank_account(data: BankAccountCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account = BankAccount(user_id=user.id, **data.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account
