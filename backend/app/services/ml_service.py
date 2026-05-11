import joblib
import pandas as pd

from app.core.config import settings

GRADE_ENCODE = {"A": 6, "B": 5, "C": 4, "D": 3, "E": 2, "F": 1, "G": 0}
DEFAULT_ENCODE = {"Y": 1, "N": 0}

HOME_OWNERSHIP_COLS = [
    "person_home_ownership_MORTGAGE",
    "person_home_ownership_OTHER",
    "person_home_ownership_OWN",
    "person_home_ownership_RENT",
]
LOAN_INTENT_COLS = [
    "loan_intent_DEBTCONSOLIDATION",
    "loan_intent_EDUCATION",
    "loan_intent_HOMEIMPROVEMENT",
    "loan_intent_MEDICAL",
    "loan_intent_PERSONAL",
    "loan_intent_VENTURE",
]

FEATURE_ORDER = [
    "person_age", "person_income", "person_emp_length",
    "loan_grade", "loan_amnt", "loan_int_rate", "loan_percent_income",
    "cb_person_default_on_file", "cb_person_cred_hist_length",
    *HOME_OWNERSHIP_COLS,
    *LOAN_INTENT_COLS,
]


class MLService:
    def __init__(self):
        self.model = joblib.load(settings.MODEL_PATH)

    def predict(self, features: dict) -> dict:
        row = {col: 0 for col in FEATURE_ORDER}

        row["person_age"] = features["person_age"]
        row["person_income"] = features["person_income"]
        row["person_emp_length"] = features["person_emp_length"]
        row["loan_grade"] = GRADE_ENCODE[features["loan_grade"]]
        row["loan_amnt"] = features["loan_amnt"]
        row["loan_int_rate"] = features["loan_int_rate"]
        row["loan_percent_income"] = features["loan_percent_income"]
        row["cb_person_default_on_file"] = DEFAULT_ENCODE[features["cb_person_default_on_file"]]
        row["cb_person_cred_hist_length"] = features["cb_person_cred_hist_length"]

        ownership_key = f"person_home_ownership_{features['person_home_ownership']}"
        if ownership_key in row:
            row[ownership_key] = 1

        intent_key = f"loan_intent_{features['loan_intent']}"
        if intent_key in row:
            row[intent_key] = 1

        df = pd.DataFrame([row])[FEATURE_ORDER]
        prediction = int(self.model.predict(df)[0])
        confidence = round(float(self.model.predict_proba(df)[0][prediction]), 4)

        return {"loan_status": prediction, "confidence": confidence}


ml_service = MLService()
