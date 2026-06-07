import joblib
import numpy as np
import pandas as pd
import shap
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

# Indonesian labels for SHAP explanation output
_LABELS: dict[str, str] = {
    "person_age":                 "Usia",
    "person_income":              "Pendapatan Tahunan",
    "person_emp_length":          "Lama Bekerja",
    "loan_grade":                 "Peringkat Kredit",
    "loan_amnt":                  "Jumlah Pinjaman",
    "loan_int_rate":              "Suku Bunga",
    "loan_percent_income":        "Rasio Pinjaman/Pendapatan",
    "cb_person_default_on_file":  "Riwayat Gagal Bayar",
    "cb_person_cred_hist_length": "Riwayat Kredit",
    "person_home_ownership":      "Status Hunian",
    "loan_intent":                "Tujuan Pinjaman",
}


class MLService:
    _instance: "MLService | None" = None

    def __init__(self) -> None:
        self._model = joblib.load(Path(settings.MODEL_PATH))
        if hasattr(self._model, "named_steps"):
            self._imputer = self._model.named_steps.get("imputer")
            self._scaler  = self._model.named_steps.get("scaler")
            clf = self._model.steps[-1][1]
        else:
            self._imputer = None
            self._scaler  = None
            clf = self._model
        self._explainer = shap.TreeExplainer(clf)

    @classmethod
    def get(cls) -> "MLService":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    # ── Private helpers ───────────────────────────────────────────────────────

    def _build_shap_explanation(self, sv: list[float]) -> list[dict]:
        """
        Aggregate per-column SHAP values into logical feature groups,
        attach Indonesian labels, and return the top 6 by absolute impact.
        """
        aggregated: dict[str, float] = {}

        for col, val in zip(_FEATURE_COLUMNS, sv):
            if col.startswith("person_home_ownership_"):
                key = "person_home_ownership"
            elif col.startswith("loan_intent_"):
                key = "loan_intent"
            else:
                key = col
            aggregated[key] = aggregated.get(key, 0.0) + val

        explanations = [
            {
                "feature":    key,
                "label":      _LABELS.get(key, key),
                "shap_value": round(float(shap_val), 6),
            }
            for key, shap_val in aggregated.items()
        ]

        explanations.sort(key=lambda x: abs(x["shap_value"]), reverse=True)
        return explanations

    # ── Public API ────────────────────────────────────────────────────────────

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

        proba = self._model.predict_proba(df)[0]
        # proba[1] = P(rejected/default). Custom threshold (lower than 0.5 default)
        # tightens the policy: more applicants are flagged as rejected.
        prediction = 1 if proba[1] >= settings.ML_REJECTION_THRESHOLD else 0
        confidence = float(proba[prediction])

        # SHAP — pass preprocessed data so the bare GBM sees the same
        # scaled feature space it was trained on
        df_shap = df.copy()
        if self._imputer is not None:
            df_shap = pd.DataFrame(self._imputer.transform(df_shap), columns=_FEATURE_COLUMNS)
        if self._scaler is not None:
            df_shap = pd.DataFrame(self._scaler.transform(df_shap), columns=_FEATURE_COLUMNS)
        raw = self._explainer.shap_values(df_shap, check_additivity=False)
        if hasattr(raw, "values"):
            raw = raw.values
        # Normalize across SHAP versions so positive = pushes toward APPROVAL (class 0):
        #   - Old SHAP returns list [shap_class_0, shap_class_1] → take class 0
        #   - New SHAP returns a 2D ndarray of decision-function SHAP (toward class 1
        #     = rejected) → negate the sign
        #   - Multi-class 3D output → take the class-0 slice
        if isinstance(raw, list):
            arr = np.asarray(raw[0])
        else:
            arr = np.asarray(raw)
            if arr.ndim == 3:
                arr = arr[:, :, 0]
            else:
                arr = -arr
        sv: list[float] = arr[0].tolist()
        shap_explanation = self._build_shap_explanation(sv)

        return {
            "loan_status":      prediction,   # 0 = approved, 1 = rejected
            "confidence":       round(confidence, 4),
            "shap_explanation": shap_explanation,
        }
