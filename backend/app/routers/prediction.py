from fastapi import APIRouter

from app.schemas.prediction import PredictionInput, PredictionOutput
from app.services.ml_service import ml_service

router = APIRouter(prefix="/prediction", tags=["Prediction"])


@router.post("/score", response_model=PredictionOutput)
def score(data: PredictionInput):
    return ml_service.predict(data.model_dump())
