from datetime import date, datetime, timedelta, timezone
from typing import List

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.credit_history import CreditHistory
from app.models.kyc_document import KYCDocument
from app.models.loan_application import LoanApplication
from app.models.otp_token import OTPToken
from app.models.repayment import Repayment
from app.models.user import User
from app.models.user_employment import UserEmployment
from app.schemas.loan import LoanApplicationCreate
from app.services.ml_service import ml_service

GRADE_FROM_CONFIDENCE = [
    (0.90, "A"),
    (0.80, "B"),
    (0.70, "C"),
    (0.60, "D"),
    (0.50, "E"),
    (0.40, "F"),
]
INT_RATE_BY_GRADE = {"A": 7.5, "B": 10.5, "C": 13.0, "D": 15.5, "E": 18.0, "F": 20.0, "G": 22.0}
PRE_ML_GRADE_THRESHOLDS = [
    (0.10, "A"), (0.20, "B"), (0.25, "C"),
    (0.30, "D"), (0.35, "E"), (0.40, "F"),
]


def apply_loan(data: LoanApplicationCreate, user: User, db: Session) -> LoanApplication:
    kyc = db.query(KYCDocument).filter(KYCDocument.user_id == user.id).first()
    if not kyc or kyc.review_status != "approved":
        raise HTTPException(status_code=400, detail="KYC not approved")

    employment = db.query(UserEmployment).filter(UserEmployment.user_id == user.id).first()
    if not employment or not employment.annual_income:
        raise HTTPException(status_code=400, detail="Employment info incomplete")

    credit = db.query(CreditHistory).filter(CreditHistory.user_id == user.id).first()

    if not user.date_of_birth:
        raise HTTPException(status_code=400, detail="Date of birth missing")
    age = (datetime.now().date() - user.date_of_birth.date()).days // 365
    if age < 21:
        raise HTTPException(status_code=400, detail="Minimum age is 21")

    loan_percent_income = round(data.loan_amnt / employment.annual_income, 4)

    if loan_percent_income > 0.4:
        raise HTTPException(status_code=400, detail="Loan exceeds 40% of monthly income")

    default_on_file = credit.default_on_file if credit else "N"
    cred_hist_length = credit.cred_hist_length if credit else 0

    if default_on_file == "Y":
        loan = LoanApplication(
            user_id=user.id,
            loan_amnt=data.loan_amnt,
            loan_intent=data.loan_intent,
            tenure_months=data.tenure_months,
            loan_percent_income=loan_percent_income,
            loan_status="rejected",
            review_status="not_required",
        )
        db.add(loan)
        db.commit()
        db.refresh(loan)
        return loan

    pre_grade = _derive_grade_from_lpi(loan_percent_income)
    loan_int_rate = INT_RATE_BY_GRADE[pre_grade]

    features = {
        "person_age": age,
        "person_income": employment.annual_income,
        "person_home_ownership": user.home_ownership or "RENT",
        "person_emp_length": employment.emp_length or 0.0,
        "loan_intent": data.loan_intent,
        "loan_grade": pre_grade,
        "loan_amnt": data.loan_amnt,
        "loan_int_rate": loan_int_rate,
        "loan_percent_income": loan_percent_income,
        "cb_person_default_on_file": default_on_file,
        "cb_person_cred_hist_length": cred_hist_length,
    }

    result = ml_service.predict(features)
    confidence = result["confidence"]
    ml_score = result["loan_status"]

    final_grade = _derive_grade_from_confidence(confidence)

    if confidence >= settings.ML_CONFIDENCE_THRESHOLD:
        loan_status = "approved" if ml_score == 1 else "rejected"
        review_status = "not_required"
    else:
        loan_status = "manual_review"
        review_status = "pending"

    loan = LoanApplication(
        user_id=user.id,
        loan_amnt=data.loan_amnt,
        loan_intent=data.loan_intent,
        loan_grade=final_grade,
        loan_int_rate=loan_int_rate,
        loan_percent_income=loan_percent_income,
        tenure_months=data.tenure_months,
        ml_score=ml_score,
        confidence=confidence,
        loan_status=loan_status,
        review_status=review_status,
    )
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


def accept_offer(loan_id: str, otp_code: str, user: User, db: Session) -> LoanApplication:
    loan = db.query(LoanApplication).filter(
        LoanApplication.id == loan_id, LoanApplication.user_id == user.id
    ).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    if loan.loan_status != "approved":
        raise HTTPException(status_code=400, detail="Loan is not in approved status")

    otp = (
        db.query(OTPToken)
        .filter(
            OTPToken.user_id == user.id,
            OTPToken.code == otp_code,
            OTPToken.purpose == "loan_acceptance",
            OTPToken.used_at.is_(None),
        )
        .first()
    )
    if not otp or otp.expires_at < datetime.now(timezone.utc).replace(tzinfo=None):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    otp.used_at = datetime.now(timezone.utc).replace(tzinfo=None)
    loan.loan_status = "disbursed"
    loan.disbursed_at = datetime.now(timezone.utc).replace(tzinfo=None)

    _generate_repayments(loan, db)
    db.commit()
    db.refresh(loan)
    return loan


def _generate_repayments(loan: LoanApplication, db: Session):
    monthly_rate = (loan.loan_int_rate / 100) / 12
    n = loan.tenure_months
    if monthly_rate > 0:
        installment = loan.loan_amnt * (monthly_rate * (1 + monthly_rate) ** n) / ((1 + monthly_rate) ** n - 1)
    else:
        installment = loan.loan_amnt / n

    installment = round(installment, 2)
    start = date.today()

    for i in range(1, n + 1):
        due = date(start.year + (start.month + i - 1) // 12, (start.month + i - 1) % 12 + 1, start.day)
        db.add(Repayment(loan_id=loan.id, due_date=due, amount=installment))


def _derive_grade_from_confidence(confidence: float) -> str:
    for threshold, grade in GRADE_FROM_CONFIDENCE:
        if confidence >= threshold:
            return grade
    return "G"


def _derive_grade_from_lpi(lpi: float) -> str:
    for threshold, grade in PRE_ML_GRADE_THRESHOLDS:
        if lpi < threshold:
            return grade
    return "G"
