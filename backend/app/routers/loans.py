from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.loan_application import LoanApplication
from app.models.repayment import Repayment
from app.models.user import User
from app.schemas.loan import AcceptOfferRequest, LoanApplicationCreate, LoanApplicationResponse, RepaymentResponse
from app.services import loan_service

router = APIRouter(prefix="/loans", tags=["Loans"])


@router.post("/apply", response_model=LoanApplicationResponse)
def apply(data: LoanApplicationCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return loan_service.apply_loan(data, user, db)


@router.get("/", response_model=List[LoanApplicationResponse])
def list_loans(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(LoanApplication).filter(LoanApplication.user_id == user.id).all()


@router.get("/{loan_id}", response_model=LoanApplicationResponse)
def get_loan(loan_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    loan = db.query(LoanApplication).filter(
        LoanApplication.id == loan_id, LoanApplication.user_id == user.id
    ).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


@router.post("/{loan_id}/accept-offer", response_model=LoanApplicationResponse)
def accept_offer(loan_id: str, data: AcceptOfferRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return loan_service.accept_offer(loan_id, data.otp_code, user, db)


@router.get("/{loan_id}/repayments", response_model=List[RepaymentResponse])
def get_repayments(loan_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    loan = db.query(LoanApplication).filter(
        LoanApplication.id == loan_id, LoanApplication.user_id == user.id
    ).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return db.query(Repayment).filter(Repayment.loan_id == loan_id).all()
