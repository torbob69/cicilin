from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_verified_user
from app.models.user import User
from app.schemas.loan import (
    AcceptOfferRequest,
    LoanApplyRequest,
    LoanApplicationResponse,
    LoanDetailResponse,
    PaymentResponse,
    RepaymentResponse,
)
from app.services import loan_service, payment_service

router = APIRouter(prefix="/loans", tags=["Loans"])


@router.post("/apply", response_model=LoanApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_loan(
    data: LoanApplyRequest,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return loan_service.apply_loan(db, user, data)


@router.get("/", response_model=list[LoanApplicationResponse])
def list_loans(
    tab: str = Query(default="all", description="all | in_review | closed | unpaid | rejected | approved"),
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return loan_service.list_loans(db, user, tab)


@router.get("/{loan_id}", response_model=LoanDetailResponse)
def get_loan(
    loan_id: int,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return loan_service.get_loan(db, user, loan_id)


@router.post("/{loan_id}/accept-offer", response_model=LoanDetailResponse)
def accept_offer(
    loan_id: int,
    data: AcceptOfferRequest,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return loan_service.accept_offer(db, user, loan_id, data)


@router.get("/{loan_id}/repayments", response_model=list[RepaymentResponse])
def list_repayments(
    loan_id: int,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return loan_service.list_repayments(db, user, loan_id)


@router.post("/{loan_id}/repayments/{repayment_id}/pay", response_model=PaymentResponse)
def pay_installment(
    loan_id: int,
    repayment_id: int,
    user: User = Depends(get_verified_user),
    db: Session = Depends(get_db),
):
    return payment_service.pay_installment(db, user, loan_id, repayment_id)
