from datetime import date, datetime
from pydantic import BaseModel, field_validator, ConfigDict


class ShapFeature(BaseModel):
    feature: str
    label: str
    shap_value: float


class LoanApplyRequest(BaseModel):
    loan_amnt: float
    loan_intent: str
    tenure_months: int
    pin: str

    @field_validator("loan_amnt")
    @classmethod
    def validate_loan_amnt(cls, v: float) -> float:
        if v < 500_000:
            raise ValueError("Minimum loan amount is Rp 500.000")
        return v

    @field_validator("loan_intent")
    @classmethod
    def validate_intent(cls, v: str) -> str:
        valid = {"PERSONAL", "EDUCATION", "MEDICAL", "VENTURE", "HOMEIMPROVEMENT", "DEBTCONSOLIDATION"}
        if v.upper() not in valid:
            raise ValueError(f"loan_intent must be one of: {', '.join(sorted(valid))}")
        return v.upper()

    @field_validator("tenure_months")
    @classmethod
    def validate_tenure(cls, v: int) -> int:
        if v not in (3, 6, 12, 24):
            raise ValueError("tenure_months must be 3, 6, 12, or 24")
        return v

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("PIN must be exactly 6 digits")
        return v


class RepaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    installment_number: int
    due_date: date
    amount: float
    penalty: float
    paid_at: datetime | None
    status: str


class LoanApplicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    loan_amnt: float
    loan_intent: str
    loan_grade: str
    loan_int_rate: float
    loan_percent_income: float
    tenure_months: int
    monthly_installment: float | None
    ml_score: int | None
    confidence: float | None
    shap_explanation: list[ShapFeature] | None = None
    loan_status: str
    review_status: str
    review_note: str | None
    reviewed_at: datetime | None
    disbursed_at: datetime | None
    created_at: datetime

    @field_validator("shap_explanation", mode="before")
    @classmethod
    def parse_shap_json(cls, v):
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v


class LoanDetailResponse(LoanApplicationResponse):
    repayments: list[RepaymentResponse] = []


class AcceptOfferRequest(BaseModel):
    pin: str

    @field_validator("pin")
    @classmethod
    def validate_pin(cls, v: str) -> str:
        if not v.isdigit() or len(v) != 6:
            raise ValueError("PIN must be exactly 6 digits")
        return v


class PaymentResponse(BaseModel):
    repayment: RepaymentResponse
    xp_gained: int
    new_xp: int
    new_rank: str
    loan_closed: bool
