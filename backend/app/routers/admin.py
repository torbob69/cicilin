from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
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


@router.post("/auth/login")
def admin_login(data: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == data.email).first()
    if not admin or not verify_password(data.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "access_token": create_access_token(admin.id, role="admin"),
        "refresh_token": create_refresh_token(admin.id, role="admin"),
        "token_type": "bearer",
    }


@router.get("/users")
def list_users(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(User).all()


@router.get("/kyc/pending")
def list_pending_kyc(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(KYCDocument).filter(KYCDocument.review_status == "pending").all()


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


@router.get("/loans/pending", response_model=List[LoanApplicationResponse])
def list_pending_loans(admin: Admin = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(LoanApplication).filter(LoanApplication.review_status == "pending").all()


@router.put("/loans/{loan_id}/review", response_model=LoanApplicationResponse)
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
    return loan
