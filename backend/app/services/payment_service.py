from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.loan_application import LoanApplication
from app.models.repayment import Repayment
from app.models.user import User
from app.schemas.loan import PaymentResponse, RepaymentResponse
from app.services import xp_service

_PAYABLE_STATUSES = {"pending", "overdue"}


def pay_installment(
    db: Session, user: User, loan_id: int, repayment_id: int
) -> PaymentResponse:
    # ── 1. Loan ownership + active check ─────────────────────────────────────
    loan = db.query(LoanApplication).filter(
        LoanApplication.id == loan_id,
        LoanApplication.user_id == user.id,
    ).first()
    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found")
    if loan.loan_status != "disbursed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Loan is not active for repayment: {loan.loan_status}",
        )

    # ── 2. Repayment check ────────────────────────────────────────────────────
    repayment = db.query(Repayment).filter(
        Repayment.id == repayment_id,
        Repayment.loan_id == loan_id,
    ).first()
    if not repayment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repayment not found")
    if repayment.status == "paid":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Installment already paid")
    if repayment.status == "waived":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Installment has been waived")
    if repayment.status not in _PAYABLE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Installment cannot be paid in status: {repayment.status}",
        )

    # ── 3. Mark paid ──────────────────────────────────────────────────────────
    now = datetime.now(timezone.utc)
    repayment.paid_at = now
    repayment.status  = "paid"

    # ── 4. XP for this installment ────────────────────────────────────────────
    today = now.date()
    if today < repayment.due_date:
        xp_delta = 35
        reason   = "pay_early"
    else:
        xp_delta = 20
        reason   = "pay_on_time"

    xp_service.add_xp(db, user, xp_delta, reason)

    # ── 5. Check if all installments are now paid ─────────────────────────────
    remaining_unpaid = (
        db.query(Repayment)
        .filter(
            Repayment.loan_id == loan_id,
            Repayment.id != repayment_id,
            Repayment.status.notin_(["paid", "waived"]),
        )
        .count()
    )
    loan_closed = remaining_unpaid == 0
    if loan_closed:
        loan.loan_status = "closed"
        xp_service.add_xp(db, user, 60, "full_repay")
        xp_delta += 60

    db.commit()
    db.refresh(repayment)
    db.refresh(user)

    return PaymentResponse(
        repayment=RepaymentResponse.model_validate(repayment),
        xp_gained=xp_delta,
        new_xp=user.xp,
        new_rank=user.rank,
        loan_closed=loan_closed,
    )
