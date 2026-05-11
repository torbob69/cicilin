from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class LoanApplicationCreate(BaseModel):
    loan_amnt: float
    loan_intent: str
    tenure_months: int


class LoanApplicationResponse(BaseModel):
    id: str
    loan_amnt: float
    loan_intent: str
    loan_grade: Optional[str] = None
    loan_int_rate: Optional[float] = None
    loan_percent_income: Optional[float] = None
    tenure_months: int
    ml_score: Optional[int] = None
    confidence: Optional[float] = None
    loan_status: str
    review_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class RepaymentResponse(BaseModel):
    id: str
    due_date: date
    amount: float
    status: str
    penalty: float
    paid_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AcceptOfferRequest(BaseModel):
    otp_code: Optional[str] = None
