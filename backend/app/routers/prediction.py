from fastapi import APIRouter

from app.core.config import settings
from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.ml_service import MLService

router = APIRouter(prefix="/prediction", tags=["Prediction"])


@router.post("/score", response_model=PredictionResponse)
def score(data: PredictionRequest) -> PredictionResponse:
    result = MLService.get().predict(
        person_age=data.person_age,
        person_income_idr=data.person_income_idr,
        person_emp_length=data.person_emp_length,
        person_home_ownership=data.person_home_ownership,
        loan_grade=data.loan_grade,
        loan_amnt_idr=data.loan_amnt_idr,
        loan_int_rate=data.loan_int_rate,
        loan_percent_income=data.loan_percent_income,
        cb_person_default_on_file=data.cb_person_default_on_file,
        cb_person_cred_hist_length=data.cb_person_cred_hist_length,
        loan_intent=data.loan_intent,
    )
    threshold = settings.ML_CONFIDENCE_THRESHOLD
    if result["confidence"] >= threshold:
        decision = "approved" if result["loan_status"] == 0 else "rejected"
    else:
        decision = "manual_review"
    return PredictionResponse(
        loan_status=result["loan_status"],
        confidence=result["confidence"],
        decision=decision,
    )
