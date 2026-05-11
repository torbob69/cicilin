from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, verify_password
from app.dependencies import get_current_admin
from app.models.admin import Admin
from app.models.kyc_document import KYCDocument
from app.models.loan_application import LoanApplication
from app.models.user import User
from app.schemas.admin import AdminLogin, KYCReviewRequest, LoanReviewRequest
from app.schemas.loan import LoanApplicationResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


class KYCItem(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    ktp_image_url: Optional[str] = None
    selfie_image_url: Optional[str] = None
    review_status: str
    rejection_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class LoanItem(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    loan_amnt: float
    loan_intent: str
    loan_grade: Optional[str] = None
    loan_int_rate: Optional[float] = None
    tenure_months: int
    confidence: Optional[float] = None
    loan_status: str
    review_status: str
    review_note: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


class UserItem(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    kyc_status: Optional[str] = None
    created_at: datetime
    model_config = {"from_attributes": True}


@router.post("/auth/login")
def admin_login(data: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == data.email).first()
    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "access_token": create_access_token(admin.id, role="admin"),
        "refresh_token": create_refresh_token(admin.id, role="admin"),
        "token_type": "bearer",
        "admin_name": admin.full_name,
    }


@router.get("/stats")
def get_stats(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return {
        "total_users": db.query(User).count(),
        "pending_kyc": db.query(KYCDocument).filter(KYCDocument.review_status == "pending").count(),
        "pending_loans": db.query(LoanApplication).filter(LoanApplication.review_status == "pending").count(),
        "total_loans": db.query(LoanApplication).count(),
        "approved_loans": db.query(LoanApplication).filter(LoanApplication.loan_status == "approved").count(),
        "disbursed_loans": db.query(LoanApplication).filter(LoanApplication.loan_status == "disbursed").count(),
    }


@router.get("/users")
def list_users(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        kyc = db.query(KYCDocument).filter(KYCDocument.user_id == u.id).first()
        result.append({
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "phone": u.phone,
            "kyc_status": kyc.review_status if kyc else "none",
            "created_at": u.created_at,
        })
    return result


@router.get("/kyc/pending")
def list_pending_kyc(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    kycs = db.query(KYCDocument).filter(KYCDocument.review_status == "pending").all()
    return _enrich_kyc_list(kycs, db)


@router.get("/kyc/all")
def list_all_kyc(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    kycs = db.query(KYCDocument).all()
    return _enrich_kyc_list(kycs, db)


def _enrich_kyc_list(kycs, db):
    result = []
    for k in kycs:
        user = db.query(User).filter(User.id == k.user_id).first()
        result.append({
            "id": k.id,
            "user_id": k.user_id,
            "user_name": user.full_name if user else None,
            "user_email": user.email if user else None,
            "ktp_image_url": k.ktp_image_url,
            "selfie_image_url": k.selfie_image_url,
            "review_status": k.review_status,
            "rejection_reason": k.rejection_reason,
            "reviewed_at": k.reviewed_at,
        })
    return result


@router.put("/kyc/{kyc_id}/review")
def review_kyc(kyc_id: str, data: KYCReviewRequest, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    kyc = db.query(KYCDocument).filter(KYCDocument.id == kyc_id).first()
    if not kyc:
        raise HTTPException(status_code=404, detail="KYC record not found")

    kyc.reviewed_by = admin.id
    kyc.reviewed_at = datetime.now(timezone.utc).replace(tzinfo=None)

    if data.approved:
        kyc.review_status = "approved"
        kyc.verified_at = datetime.now(timezone.utc).replace(tzinfo=None)
    else:
        kyc.review_status = "rejected"
        kyc.rejection_reason = data.rejection_reason

    db.commit()
    return {"message": "KYC reviewed", "status": kyc.review_status}


@router.get("/loans/pending")
def list_pending_loans(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    loans = db.query(LoanApplication).filter(LoanApplication.review_status == "pending").all()
    return _enrich_loan_list(loans, db)


@router.get("/loans/all")
def list_all_loans(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    loans = db.query(LoanApplication).order_by(LoanApplication.created_at.desc()).all()
    return _enrich_loan_list(loans, db)


def _enrich_loan_list(loans, db):
    result = []
    for loan in loans:
        user = db.query(User).filter(User.id == loan.user_id).first()
        result.append({
            "id": loan.id,
            "user_id": loan.user_id,
            "user_name": user.full_name if user else None,
            "loan_amnt": loan.loan_amnt,
            "loan_intent": loan.loan_intent,
            "loan_grade": loan.loan_grade,
            "loan_int_rate": loan.loan_int_rate,
            "tenure_months": loan.tenure_months,
            "confidence": loan.confidence,
            "loan_status": loan.loan_status,
            "review_status": loan.review_status,
            "review_note": loan.review_note,
            "created_at": loan.created_at,
        })
    return result


@router.put("/loans/{loan_id}/review")
def review_loan(loan_id: str, data: LoanReviewRequest, admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    loan = db.query(LoanApplication).filter(LoanApplication.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.review_status != "pending":
        raise HTTPException(status_code=400, detail="Loan is not pending review")

    loan.reviewed_by = admin.id
    loan.reviewed_at = datetime.now(timezone.utc).replace(tzinfo=None)
    loan.review_note = data.review_note

    if data.approved:
        loan.review_status = "approved"
        loan.loan_status = "approved"
    else:
        loan.review_status = "rejected"
        loan.loan_status = "rejected"

    db.commit()
    db.refresh(loan)
    return {"id": loan.id, "loan_status": loan.loan_status, "review_status": loan.review_status}
