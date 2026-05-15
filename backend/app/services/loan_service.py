from datetime import date, datetime, timezone
from dateutil.relativedelta import relativedelta

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import verify_pin
from app.models.credit_history import CreditHistory
from app.models.kyc_document import KYCDocument
from app.models.loan_application import LoanApplication
from app.models.repayment import Repayment
from app.models.user import User
from app.models.user_employment import UserEmployment
from app.schemas.loan import (
    AcceptOfferRequest,
    LoanApplyRequest,
    LoanApplicationResponse,
    LoanDetailResponse,
    RepaymentResponse,
)
from app.services.ml_service import MLService
from sqlalchemy.orm import joinedload

_RANK_CONFIG: dict[str, dict] = {
    "Ruby":     {"grade": "A", "monthly_limit": 100_000_000, "interest_rate": 6.0},
    "Diamond":  {"grade": "B", "monthly_limit": 50_000_000,  "interest_rate": 9.0},
    "Platinum": {"grade": "C", "monthly_limit": 25_000_000,  "interest_rate": 12.0},
    "Gold":     {"grade": "D", "monthly_limit": 10_000_000,  "interest_rate": 15.0},
    "Silver":   {"grade": "E", "monthly_limit": 5_000_000,   "interest_rate": 18.0},
    "Bronze":   {"grade": "F", "monthly_limit": 2_000_000,   "interest_rate": 24.0},
    "Iron":     {"grade": "G", "monthly_limit": 0,           "interest_rate": 0.0},
}

# Loan tab → SQL filter values
_TAB_STATUS_MAP: dict[str, list[str]] = {
    "all":        [],  # no filter
    "in_review":  ["manual_review"],
    "closed":     ["closed"],
    "unpaid":     ["disbursed"],  # further filtered by tenor end date in service
    "rejected":   ["rejected"],
    "approved":   ["approved", "disbursed"],
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _calc_monthly_installment(principal: float, annual_rate_pct: float, n_months: int) -> float:
    if annual_rate_pct == 0:
        return round(principal / n_months, 2)
    r = annual_rate_pct / 100 / 12
    pmt = principal * r * (1 + r) ** n_months / ((1 + r) ** n_months - 1)
    return round(pmt, 2)


def _age_from_dob(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _verify_pin_or_raise(user: User, pin: str) -> None:
    if not user.pin_hash:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="PIN not set. Please set your PIN first.")
    if not verify_pin(pin, user.pin_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect PIN")


# ── Apply ─────────────────────────────────────────────────────────────────────

def apply_loan(db: Session, user: User, data: LoanApplyRequest) -> LoanApplicationResponse:
    # ── 1. PIN verification ───────────────────────────────────────────────────
    _verify_pin_or_raise(user, data.pin)

    # ── 2. Iron rank block ────────────────────────────────────────────────────
    if user.rank == "Iron":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Iron rank users cannot apply for loans. Pay outstanding debts to recover rank.",
        )

    # ── 3. KYC approval check ─────────────────────────────────────────────────
    kyc = db.query(KYCDocument).filter(KYCDocument.user_id == user.id).first()
    if not kyc or kyc.review_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="KYC documents must be fully approved before applying for a loan.",
        )

    # ── 4. Employment data check ──────────────────────────────────────────────
    emp = db.query(UserEmployment).filter(UserEmployment.user_id == user.id).first()
    if not emp or emp.annual_income is None or emp.emp_length is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employment info (annual income and employment length) is required before applying.",
        )

    if not user.date_of_birth:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Date of birth is required. Please complete your KYC profile.",
        )

    if not user.home_ownership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Home ownership status is required. Please update your profile.",
        )

    # ── 5. Age check ──────────────────────────────────────────────────────────
    age = _age_from_dob(user.date_of_birth)
    if age < 21:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum applicant age is 21 years.",
        )

    # ── 6. Rank config ────────────────────────────────────────────────────────
    rank_cfg = _RANK_CONFIG.get(user.rank, _RANK_CONFIG["Gold"])
    loan_grade    = rank_cfg["grade"]
    loan_int_rate = rank_cfg["interest_rate"]
    monthly_limit = rank_cfg["monthly_limit"]

    # ── 7. Monthly limit check ────────────────────────────────────────────────
    month_start = date.today().replace(day=1)
    used_this_month = (
        db.query(LoanApplication)
        .filter(
            LoanApplication.user_id == user.id,
            LoanApplication.created_at >= datetime(month_start.year, month_start.month, 1, tzinfo=timezone.utc),
            LoanApplication.loan_status.notin_(["rejected"]),
        )
        .with_entities(LoanApplication.loan_amnt)
        .all()
    )
    total_used = sum(float(row.loan_amnt) for row in used_this_month)
    remaining  = monthly_limit - total_used

    if data.loan_amnt > remaining:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested amount exceeds your remaining monthly limit of Rp {remaining:,.0f}.",
        )

    # ── 8. loan_percent_income check ─────────────────────────────────────────
    annual_income = float(emp.annual_income)
    if annual_income <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Annual income must be positive.",
        )
    loan_pct_income = data.loan_amnt / annual_income
    if loan_pct_income > 0.40:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan amount exceeds 40% of your annual income (loan_percent_income = {loan_pct_income:.2%}).",
        )

    # ── 9. Monthly installment ────────────────────────────────────────────────
    monthly_installment = _calc_monthly_installment(data.loan_amnt, loan_int_rate, data.tenure_months)

    # ── 10. Credit history ────────────────────────────────────────────────────
    credit = db.query(CreditHistory).filter(CreditHistory.user_id == user.id).first()
    default_on_file  = credit.default_on_file if credit else "N"
    cred_hist_length = credit.cred_hist_length if credit else 0

    # ── 11. ML scoring ────────────────────────────────────────────────────────
    home_ownership = (user.home_ownership or "").upper()
    if home_ownership not in ("RENT", "OWN", "MORTGAGE", "OTHER"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid home ownership value. Must be RENT, OWN, MORTGAGE, or OTHER.",
        )
    ml_result = MLService.get().predict(
        person_age=age,
        person_income_idr=annual_income,
        person_emp_length=float(emp.emp_length),
        person_home_ownership=home_ownership,
        loan_grade=loan_grade,
        loan_amnt_idr=data.loan_amnt,
        loan_int_rate=loan_int_rate,
        loan_percent_income=loan_pct_income,
        cb_person_default_on_file=default_on_file,
        cb_person_cred_hist_length=cred_hist_length,
        loan_intent=data.loan_intent,
    )

    ml_score   = ml_result["loan_status"]
    confidence = ml_result["confidence"]
    threshold  = settings.ML_CONFIDENCE_THRESHOLD

    if confidence >= threshold:
        loan_status   = "approved" if ml_score == 1 else "rejected"
        review_status = "not_required"
    else:
        loan_status   = "manual_review"
        review_status = "pending"

    # ── 12. Persist ───────────────────────────────────────────────────────────
    loan = LoanApplication(
        user_id=user.id,
        loan_amnt=data.loan_amnt,
        loan_intent=data.loan_intent,
        loan_grade=loan_grade,
        loan_int_rate=loan_int_rate,
        loan_percent_income=loan_pct_income,
        tenure_months=data.tenure_months,
        monthly_installment=monthly_installment,
        ml_score=ml_score,
        confidence=confidence,
        loan_status=loan_status,
        review_status=review_status,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return LoanApplicationResponse.model_validate(loan)


# ── List ──────────────────────────────────────────────────────────────────────

def list_loans(db: Session, user: User, tab: str = "all") -> list[LoanApplicationResponse]:
    q = db.query(LoanApplication).filter(LoanApplication.user_id == user.id)

    statuses = _TAB_STATUS_MAP.get(tab, [])
    if statuses:
        q = q.filter(LoanApplication.loan_status.in_(statuses))

    loans = q.order_by(LoanApplication.created_at.desc()).all()

    if tab == "unpaid":
        today = date.today()
        loans = [
            l for l in loans
            if l.disbursed_at is not None
            and (l.disbursed_at.date() + relativedelta(months=l.tenure_months)) < today
        ]

    return [LoanApplicationResponse.model_validate(l) for l in loans]


# ── Detail ────────────────────────────────────────────────────────────────────

def get_loan(db: Session, user: User, loan_id: int) -> LoanDetailResponse:
    loan = (
        db.query(LoanApplication)
        .filter(LoanApplication.id == loan_id, LoanApplication.user_id == user.id)
        .options(joinedload(LoanApplication.repayments))
        .first()
    )
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")
    return LoanDetailResponse.model_validate(loan)


# ── Repayments ────────────────────────────────────────────────────────────────

def list_repayments(db: Session, user: User, loan_id: int) -> list[RepaymentResponse]:
    loan = db.query(LoanApplication).filter(
        LoanApplication.id == loan_id,
        LoanApplication.user_id == user.id,
    ).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")

    repayments = (
        db.query(Repayment)
        .filter(Repayment.loan_id == loan_id)
        .order_by(Repayment.installment_number)
        .all()
    )
    return [RepaymentResponse.model_validate(r) for r in repayments]


# ── Accept Offer ──────────────────────────────────────────────────────────────

def accept_offer(db: Session, user: User, loan_id: int, data: AcceptOfferRequest) -> LoanDetailResponse:
    _verify_pin_or_raise(user, data.pin)

    loan = db.query(LoanApplication).filter(
        LoanApplication.id == loan_id,
        LoanApplication.user_id == user.id,
    ).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")
    if loan.loan_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan cannot be accepted in its current state: {loan.loan_status}",
        )
    if loan.monthly_installment is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Loan installment amount is missing. Please contact support.",
        )

    now = datetime.now(timezone.utc)
    loan.loan_status  = "disbursed"
    loan.disbursed_at = now

    # Single lump-sum repayment due at end of tenor
    total_repayment = round(float(loan.monthly_installment) * loan.tenure_months, 2)
    due_date = now.date() + relativedelta(months=loan.tenure_months)
    db.add(Repayment(
        loan_id=loan.id,
        installment_number=1,
        due_date=due_date,
        amount=total_repayment,
        status="pending",
    ))

    db.commit()
    loan = (
        db.query(LoanApplication)
        .filter(LoanApplication.id == loan.id)
        .options(joinedload(LoanApplication.repayments))
        .first()
    )
    return LoanDetailResponse.model_validate(loan)
