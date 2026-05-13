from pydantic import BaseModel, field_validator


class PredictionRequest(BaseModel):
    person_age: int
    person_income_idr: float
    person_emp_length: float
    person_home_ownership: str
    loan_grade: str
    loan_amnt_idr: float
    loan_int_rate: float
    loan_percent_income: float
    cb_person_default_on_file: str
    cb_person_cred_hist_length: int
    loan_intent: str

    @field_validator("person_home_ownership")
    @classmethod
    def validate_home_ownership(cls, v: str) -> str:
        if v not in ("RENT", "OWN", "MORTGAGE", "OTHER"):
            raise ValueError("Must be RENT, OWN, MORTGAGE, or OTHER")
        return v

    @field_validator("loan_grade")
    @classmethod
    def validate_loan_grade(cls, v: str) -> str:
        if v not in ("A", "B", "C", "D", "E", "F", "G"):
            raise ValueError("Must be A–G")
        return v

    @field_validator("cb_person_default_on_file")
    @classmethod
    def validate_default_on_file(cls, v: str) -> str:
        if v not in ("Y", "N"):
            raise ValueError("Must be Y or N")
        return v

    @field_validator("loan_intent")
    @classmethod
    def validate_loan_intent(cls, v: str) -> str:
        valid = {"PERSONAL", "EDUCATION", "MEDICAL", "VENTURE", "HOMEIMPROVEMENT", "DEBTCONSOLIDATION"}
        if v.upper() not in valid:
            raise ValueError(f"Must be one of: {', '.join(sorted(valid))}")
        return v.upper()


class PredictionResponse(BaseModel):
    loan_status: int
    confidence: float
    decision: str  # "approved" | "rejected" | "manual_review"
