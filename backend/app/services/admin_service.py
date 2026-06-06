from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.constants import RANK_CONFIG as _RANK_CONFIG
from app.models.admin import Admin
from app.models.credit_history import CreditHistory
from app.models.kyc_document import KYCDocument
from app.models.loan_application import LoanApplication
from app.models.user import User
from app.schemas.admin import (
    AdminKYCListItem,
    AdminLoanListItem,
    AdminUserListItem,
    DevUserDetail,
    DevUserOverrideRequest,
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


# ── Dev God Mode ──────────────────────────────────────────────────────────────

VALID_RANKS = {"Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ruby"}

def _monthly_usage(db: Session, user_id: int) -> tuple[float, int]:
    """Returns (used_this_month, monthly_limit) for the given user."""
    user = db.query(User).filter(User.id == user_id).first()
    rank_cfg = _RANK_CONFIG.get(user.rank if user else "Gold", _RANK_CONFIG["Gold"])
    monthly_limit = rank_cfg["monthly_limit"] if rank_cfg else 0

    month_start = date.today().replace(day=1)
    rows = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.user_id == user_id,
            LoanApplication.created_at >= datetime(month_start.year, month_start.month, 1, tzinfo=timezone.utc),
            LoanApplication.loan_status.notin_(["rejected", "manual_review"]),
        )
        .with_entities(LoanApplication.loan_amnt)
        .all()
    )
    used = sum(float(r.loan_amnt) for r in rows)
    return used, monthly_limit


def dev_get_user(db: Session, user_id: int) -> DevUserDetail:
    user = (
        db.query(User)
        .options(joinedload(User.kyc_document), joinedload(User.credit_history))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    kyc_status = user.kyc_document.review_status if user.kyc_document else "no_kyc"
    ch = user.credit_history
    used, monthly_limit = _monthly_usage(db, user_id)
    return DevUserDetail(
        id=user.id,
        full_name=user.full_name,
        phone=user.phone,
        email=user.email,
        rank=user.rank,
        xp=user.xp,
        is_verified=user.is_verified,
        is_active=user.is_active,
        kyc_status=kyc_status,
        default_on_file=ch.default_on_file if ch else "N",
        cred_hist_length=ch.cred_hist_length if ch else 0,
        created_at=user.created_at,
        monthly_limit=monthly_limit,
        used_this_month=used,
        remaining_this_month=max(0.0, monthly_limit - used),
    )


def dev_override_user(db: Session, user_id: int, data: DevUserOverrideRequest) -> DevUserDetail:
    user = (
        db.query(User)
        .options(joinedload(User.kyc_document), joinedload(User.credit_history))
        .filter(User.id == user_id)
        .first()
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if data.rank is not None:
        if data.rank not in VALID_RANKS:
            raise HTTPException(status_code=400, detail=f"Invalid rank. Must be one of: {', '.join(sorted(VALID_RANKS))}")
        user.rank = data.rank

    if data.xp is not None:
        user.xp = max(0, data.xp)

    if data.is_verified is not None:
        user.is_verified = data.is_verified

    if data.is_active is not None:
        user.is_active = data.is_active

    if data.kyc_status is not None:
        if data.kyc_status not in ("approved", "rejected", "pending"):
            raise HTTPException(status_code=400, detail="kyc_status must be approved, rejected, or pending")
        if user.kyc_document:
            user.kyc_document.review_status = data.kyc_status
            if data.kyc_status == "approved":
                user.kyc_document.verified_at = datetime.now(timezone.utc)
        else:
            kyc = KYCDocument(user_id=user.id, review_status=data.kyc_status)
            db.add(kyc)

    if data.default_on_file is not None:
        if data.default_on_file not in ("Y", "N"):
            raise HTTPException(status_code=400, detail="default_on_file must be Y or N")
        if user.credit_history:
            user.credit_history.default_on_file = data.default_on_file
        else:
            ch = CreditHistory(user_id=user.id, default_on_file=data.default_on_file, cred_hist_length=0)
            db.add(ch)

    if data.cred_hist_length is not None:
        if user.credit_history:
            user.credit_history.cred_hist_length = max(0, data.cred_hist_length)
            user.cb_person_cred_hist_length = max(0, data.cred_hist_length)
        else:
            ch = CreditHistory(user_id=user.id, default_on_file="N", cred_hist_length=max(0, data.cred_hist_length))
            db.add(ch)
            user.cb_person_cred_hist_length = max(0, data.cred_hist_length)

    db.commit()
    db.refresh(user)
    return dev_get_user(db, user_id)


def dev_reset_monthly_limit(db: Session, user_id: int) -> DevUserDetail:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    month_start = date.today().replace(day=1)
    # Reject every non-rejected loan this month so the limit counter resets to 0
    db.query(LoanApplication).filter(
        LoanApplication.user_id == user_id,
        LoanApplication.created_at >= datetime(month_start.year, month_start.month, 1, tzinfo=timezone.utc),
        LoanApplication.loan_status != "rejected",
    ).update({"loan_status": "rejected", "review_status": "not_required"}, synchronize_session=False)

    db.commit()
    return dev_get_user(db, user_id)


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
        reviewed_by=loan.reviewed_by,
        reviewed_at=loan.reviewed_at,
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
