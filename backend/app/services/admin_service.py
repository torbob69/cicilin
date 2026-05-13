from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.admin import Admin
from app.models.kyc_document import KYCDocument
from app.models.loan_application import LoanApplication
from app.models.user import User
from app.schemas.admin import (
    AdminKYCListItem,
    AdminLoanListItem,
    AdminUserListItem,
    KYCReviewRequest,
    LoanReviewRequest,
    PaginatedUsers,
)


# ── KYC ──────────────────────────────────────────────────────────────────────

def list_pending_kyc(db: Session) -> list[AdminKYCListItem]:
    records = (
        db.query(KYCDocument)
        .filter(
            KYCDocument.review_status == "pending",
            or_(
                KYCDocument.ktp_image_url.isnot(None),
                KYCDocument.kk_image_url.isnot(None),
                KYCDocument.selfie_image_url.isnot(None),
                KYCDocument.bank_letter_url.isnot(None),
            ),
        )
        .options(joinedload(KYCDocument.user))
        .order_by(KYCDocument.updated_at.asc())
        .all()
    )
    return [AdminKYCListItem.model_validate(k) for k in records]


def review_kyc(db: Session, admin: Admin, kyc_id: int, data: KYCReviewRequest) -> AdminKYCListItem:
    kyc = (
        db.query(KYCDocument)
        .filter(KYCDocument.id == kyc_id)
        .options(joinedload(KYCDocument.user))
        .first()
    )
    if not kyc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="KYC record not found")
    if kyc.review_status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"KYC is already {kyc.review_status}",
        )

    now = datetime.now(timezone.utc)
    kyc.review_status    = data.decision
    kyc.reviewed_by      = admin.id
    kyc.reviewed_at      = now
    kyc.rejection_reason = data.rejection_reason if data.decision == "rejected" else None
    if data.decision == "approved":
        kyc.verified_at = now

    db.commit()
    db.refresh(kyc)
    return AdminKYCListItem.model_validate(kyc)


# ── Loans ─────────────────────────────────────────────────────────────────────

def list_pending_loans(db: Session) -> list[AdminLoanListItem]:
    loans = (
        db.query(LoanApplication)
        .filter(LoanApplication.loan_status == "manual_review")
        .options(joinedload(LoanApplication.user).joinedload(User.employment))
        .order_by(LoanApplication.created_at.asc())
        .all()
    )
    return [_loan_to_admin(l) for l in loans]


def review_loan(
    db: Session, admin: Admin, loan_id: int, data: LoanReviewRequest
) -> AdminLoanListItem:
    loan = (
        db.query(LoanApplication)
        .filter(LoanApplication.id == loan_id)
        .options(joinedload(LoanApplication.user).joinedload(User.employment))
        .first()
    )
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")
    if loan.loan_status != "manual_review":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan is not in manual_review state: {loan.loan_status}",
        )

    now = datetime.now(timezone.utc)
    loan.loan_status   = data.decision
    loan.review_status = data.decision
    loan.reviewed_by   = admin.id
    loan.reviewed_at   = now
    loan.review_note   = data.review_note

    db.commit()
    db.refresh(loan)
    return _loan_to_admin(loan)


# ── Users ─────────────────────────────────────────────────────────────────────

def list_users(db: Session, page: int, page_size: int) -> PaginatedUsers:
    total = db.query(User).count()
    users = (
        db.query(User)
        .options(joinedload(User.kyc_document))
        .order_by(User.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return PaginatedUsers(
        total=total,
        page=page,
        page_size=page_size,
        items=[_user_to_admin(u) for u in users],
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

def _loan_to_admin(loan: LoanApplication) -> AdminLoanListItem:
    user = loan.user
    emp  = user.employment if user else None
    return AdminLoanListItem(
        id=loan.id,
        user_id=loan.user_id,
        user_full_name=user.full_name if user else "",
        user_phone=user.phone if user else "",
        user_email=user.email if user else "",
        user_rank=user.rank if user else "",
        user_xp=user.xp if user else 0,
        annual_income=float(emp.annual_income) if emp and emp.annual_income is not None else None,
        emp_length=float(emp.emp_length) if emp and emp.emp_length is not None else None,
        loan_amnt=float(loan.loan_amnt),
        loan_intent=loan.loan_intent,
        loan_grade=loan.loan_grade,
        loan_int_rate=loan.loan_int_rate,
        loan_percent_income=loan.loan_percent_income,
        tenure_months=loan.tenure_months,
        monthly_installment=float(loan.monthly_installment) if loan.monthly_installment is not None else None,
        ml_score=loan.ml_score,
        confidence=loan.confidence,
        loan_status=loan.loan_status,
        review_status=loan.review_status,
        review_note=loan.review_note,
        created_at=loan.created_at,
    )


def _user_to_admin(user: User) -> AdminUserListItem:
    kyc_status = user.kyc_document.review_status if user.kyc_document else "no_kyc"
    return AdminUserListItem(
        id=user.id,
        full_name=user.full_name,
        phone=user.phone,
        email=user.email,
        rank=user.rank,
        xp=user.xp,
        is_verified=user.is_verified,
        kyc_status=kyc_status,
        created_at=user.created_at,
    )
