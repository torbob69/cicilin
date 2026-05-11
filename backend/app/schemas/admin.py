from pydantic import BaseModel, EmailStr
from typing import Optional


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class KYCReviewRequest(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None


class LoanReviewRequest(BaseModel):
    approved: bool
    review_note: Optional[str] = None
