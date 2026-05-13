import joblib
import pandas as pd
from pathlib import Path

from app.core.config import settings

# Exact column order the model was trained on (from feature_names_in_)
_FEATURE_COLUMNS = [
    "person_age",
    "person_income",
    "person_emp_length",
    "loan_grade",
    "loan_amnt",
    "loan_int_rate",
    "loan_percent_income",
    "cb_person_default_on_file",
    "cb_person_cred_hist_length",
    "person_home_ownership_MORTGAGE",
    "person_home_ownership_OTHER",
    "person_home_ownership_OWN",
    "person_home_ownership_RENT",
    "loan_intent_DEBTCONSOLIDATION",
    "loan_intent_EDUCATION",
    "loan_intent_HOMEIMPROVEMENT",
    "loan_intent_MEDICAL",
    "loan_intent_PERSONAL",
    "loan_intent_VENTURE",
]

_GRADE_ORDINAL = {"A": 6, "B": 5, "C": 4, "D": 3, "E": 2, "F": 1, "G": 0}
_HOME_OWN_OPTS = ("MORTGAGE", "OTHER", "OWN", "RENT")
_INTENT_OPTS   = ("DEBTCONSOLIDATION", "EDUCATION", "HOMEIMPROVEMENT", "MEDICAL", "PERSONAL", "VENTURE")


class MLService:
    _instance: "MLService | None" = None

    def __init__(self) -> None:
        self._model = joblib.load(Path(settings.MODEL_PATH))

    @classmethod
    def get(cls) -> "MLService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def predict(
        self,
        person_age: int,
        person_income_idr: float,
        person_emp_length: float,
        person_home_ownership: str,
        loan_grade: str,
        loan_amnt_idr: float,
        loan_int_rate: float,
        loan_percent_income: float,
        cb_person_default_on_file: str,
        cb_person_cred_hist_length: int,
        loan_intent: str,
    ) -> dict:
        # IDR → USD-equivalent via PPP before feeding to model
        person_income = person_income_idr / settings.PPP_FACTOR
        loan_amnt     = loan_amnt_idr / settings.PPP_FACTOR

        row: dict = {
            "person_age":                person_age,
            "person_income":             person_income,
            "person_emp_length":         person_emp_length,
            "loan_grade":                _GRADE_ORDINAL[loan_grade],
            "loan_amnt":                 loan_amnt,
            "loan_int_rate":             loan_int_rate,
            "loan_percent_income":       loan_percent_income,
            "cb_person_default_on_file": 1 if cb_person_default_on_file == "Y" else 0,
            "cb_person_cred_hist_length": cb_person_cred_hist_length,
        }

        for opt in _HOME_OWN_OPTS:
            row[f"person_home_ownership_{opt}"] = 1 if person_home_ownership == opt else 0

        for opt in _INTENT_OPTS:
            row[f"loan_intent_{opt}"] = 1 if loan_intent == opt else 0

        df = pd.DataFrame([row], columns=_FEATURE_COLUMNS)

        prediction = int(self._model.predict(df)[0])
        proba = self._model.predict_proba(df)[0]
        confidence = float(proba[prediction])

        return {
            "loan_status": prediction,   # 1 = approved, 0 = rejected
            "confidence":  round(confidence, 4),
        }
