# CLAUDE.md — Loan Approval App

## Project Overview

A mobile-first loan approval application (pinjol/fintech lending) that uses a pre-trained **Gradient Boosting ML model** to score and approve/reject loan applications in real time.

- **User App**: React Native + Expo (`frontend/user/`)
- **Admin Panel**: React + Vite (`frontend/admin/`)
- **Backend API**: FastAPI (Python)
- **Database**: MySQL (via Laragon)
- **ML Model**: Gradient Boosting (pre-trained, served via FastAPI)

---

## Repository Structure

```
Final Project/
├── backend/                        # FastAPI backend
│   ├── app/
│   │   ├── main.py                 # FastAPI entry point
│   │   ├── core/
│   │   │   ├── config.py           # Env vars, settings
│   │   │   ├── security.py         # JWT, password hashing
│   │   │   └── database.py         # SQLAlchemy engine + session
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── admin.py
│   │   │   ├── kyc_document.py
│   │   │   ├── user_employment.py
│   │   │   ├── bank_account.py
│   │   │   ├── loan_application.py
│   │   │   ├── repayment.py
│   │   │   ├── credit_history.py
│   │   │   └── otp_token.py
│   │   ├── schemas/                # Pydantic schemas (request/response)
│   │   │   ├── user.py
│   │   │   ├── admin.py
│   │   │   ├── loan.py
│   │   │   └── prediction.py
│   │   ├── routers/                # API route handlers
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── loans.py
│   │   │   ├── prediction.py
│   │   │   └── admin.py
│   │   ├── services/               # Business logic layer
│   │   │   ├── auth_service.py
│   │   │   ├── loan_service.py
│   │   │   ├── ml_service.py       # Loads and runs the GB model
│   │   │   └── cloudinary_service.py
│   │   └── ml/
│   │       └── best_model_gradient_boosting.pkl
│   ├── migrations/                 # Alembic DB migrations
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── user/                       # React Native + Expo (user-facing app)
│   │   ├── app/                    # Expo Router file-based routing
│   │   │   ├── (auth)/
│   │   │   │   ├── login.tsx
│   │   │   │   └── register.tsx
│   │   │   ├── (onboarding)/
│   │   │   │   ├── kyc.tsx         # Upload KTP + selfie
│   │   │   │   └── bank-account.tsx
│   │   │   ├── (tabs)/
│   │   │   │   ├── home.tsx
│   │   │   │   ├── apply.tsx       # Loan application form
│   │   │   │   ├── status.tsx      # Application status
│   │   │   │   └── profile.tsx
│   │   │   └── _layout.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   │   └── api.ts              # Axios API client
│   │   ├── store/                  # Zustand state management
│   │   ├── constants/
│   │   ├── app.json
│   │   └── package.json
│   │
│   └── admin/                      # React + Vite (admin web panel)
│       ├── src/
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── Dashboard.tsx
│       │   │   ├── KYCReview.tsx
│       │   │   └── LoanReview.tsx
│       │   ├── components/
│       │   ├── services/
│       │   │   └── api.ts
│       │   └── main.tsx
│       ├── index.html
│       └── package.json
│
└── training model/                 # ML training artifacts (do not modify)
    ├── best_model_gradient_boosting.pkl
    ├── main.ipynb
    └── ...
```

---

## System Flow

### Phase 1 — Register & KYC
```
User registers (name, phone, email, password)
  → OTP verification via SMS
  → Upload KTP photo
  → Liveness check: selfie holding KTP
  → Basic profile info: address, job, income, employment length
  → Add bank account / e-wallet
```

### Phase 2 — Loan Application
```
User fills loan form:
  - loan_amnt     : how much they want to borrow
  - loan_intent   : purpose (education / medical / personal / business / etc)
  - loan tenure   : repayment duration (months)
```

### Phase 3 — ML Scoring (core feature)
```
Backend collects all features:
  - person_age              ← derived from KTP birth date
  - person_income           ← from user profile
  - person_home_ownership   ← from user profile
  - person_emp_length       ← from user profile
  - loan_intent             ← from loan form
  - loan_amnt               ← from loan form
  - loan_int_rate           ← set by business rules / risk tier
  - loan_percent_income     ← auto-calculated: loan_amnt / person_income (annual)
  - loan_grade              ← derived from internal scoring rules
  - cb_person_default_on_file    ← from internal credit history DB
  - cb_person_cred_hist_length   ← from internal credit history DB

  → ml_service.py runs best_model_gradient_boosting.pkl
  → Returns: loan_status (approved / rejected) + confidence score
  → If confidence < 0.90 → route to admin manual review queue
```

### Phase 4 — Offer & Agreement
```
If approved (auto or by admin):
  → Show loan offer: amount, interest rate, tenor, monthly installment
  → User reviews e-contract
  → OTP confirmation to bind agreement
```

### Phase 5 — Disbursement
```
  → Funds sent to registered bank account / e-wallet
  → Status updated in DB
  → Push notification sent to user
```

### Phase 6 — Repayment
```
  → Reminders D-3, D-1 before due date
  → User pays via virtual account / e-wallet / bank transfer
  → Late payment triggers penalty logic
```

---

## ML Model

### Model Info
- **Algorithm**: Gradient Boosting Classifier
- **File**: `backend/app/ml/best_model_gradient_boosting.pkl`
- **Framework**: scikit-learn
- **Task**: Binary classification — loan approved (1) or rejected (0)

### Input Features

| Feature | Type | Description |
|---|---|---|
| `person_age` | int | Applicant's age |
| `person_income` | float | Annual income (IDR) |
| `person_home_ownership` | str | RENT / OWN / MORTGAGE / OTHER |
| `person_emp_length` | float | Years of employment |
| `loan_intent` | str | PERSONAL / EDUCATION / MEDICAL / VENTURE / HOMEIMPROVEMENT / DEBTCONSOLIDATION |
| `loan_grade` | str | A / B / C / D / E / F / G |
| `loan_amnt` | float | Requested loan amount (IDR) |
| `loan_int_rate` | float | Interest rate (%) |
| `loan_percent_income` | float | Monthly loan installment / monthly income |
| `cb_person_default_on_file` | str | Y / N |
| `cb_person_cred_hist_length` | int | Years of credit history |

### Output

| Field | Type | Description |
|---|---|---|
| `loan_status` | int | 1 = Approved, 0 = Rejected |
| `confidence` | float | Model probability score (0.0 – 1.0) |

### Serving Example
```python
# backend/app/services/ml_service.py
import pickle
import pandas as pd

class MLService:
    def __init__(self):
        with open("app/ml/best_model_gradient_boosting.pkl", "rb") as f:
            self.model = pickle.load(f)

    def predict(self, features: dict) -> dict:
        df = pd.DataFrame([features])
        prediction = self.model.predict(df)[0]
        confidence = self.model.predict_proba(df)[0][prediction]
        return {
            "loan_status": int(prediction),
            "confidence": round(float(confidence), 4)
        }
```

> **Important**: Categorical features (`loan_intent`, `person_home_ownership`, `loan_grade`, etc.)
> must be encoded exactly as done during model training. Check the training notebook for the
> label encoding map before serving.

---

## API Endpoints

### Auth (User)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |
| POST | `/auth/verify-otp` | Verify OTP |
| POST | `/auth/refresh` | Refresh access token |

### Auth (Admin)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/admin/auth/login` | Admin login, returns JWT |

### User / KYC
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users/me` | Get current user profile |
| PUT | `/users/me` | Update profile |
| POST | `/users/kyc/upload-ktp` | Upload KTP image → Cloudinary |
| POST | `/users/kyc/upload-selfie` | Upload liveness selfie → Cloudinary |
| POST | `/users/bank-account` | Add bank / e-wallet account |

### Loans
| Method | Endpoint | Description |
|---|---|---|
| POST | `/loans/apply` | Submit loan application → triggers ML scoring |
| GET | `/loans/` | List user's loan applications |
| GET | `/loans/{loan_id}` | Get loan detail + status |
| POST | `/loans/{loan_id}/accept-offer` | User accepts the loan offer |
| GET | `/loans/{loan_id}/repayments` | Get repayment schedule |

### Admin
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/kyc/pending` | List pending KYC reviews |
| PUT | `/admin/kyc/{kyc_id}/review` | Approve or reject a KYC submission |
| GET | `/admin/loans/pending` | List loan applications pending manual review |
| PUT | `/admin/loans/{loan_id}/review` | Approve or reject a loan manually |
| GET | `/admin/users` | List all users |

### ML / Internal
| Method | Endpoint | Description |
|---|---|---|
| POST | `/prediction/score` | (Internal) Run ML scoring directly |

---

## Database Schema (Core Tables)

```sql
-- Users
users (id, phone, email, password_hash, full_name, nik, date_of_birth,
       address, home_ownership, created_at)

-- Admins (separate from users)
admins (id, email, password_hash, full_name, created_at)

-- OTP Tokens
otp_tokens (id, user_id, code, purpose, expires_at, used_at, created_at)

-- KYC Documents
kyc_documents (id, user_id,
               ktp_image_url, selfie_image_url,
               review_status,           -- pending / approved / rejected
               reviewed_by,             -- FK to admins.id
               rejection_reason,
               reviewed_at, verified_at)

-- Employment Info
user_employment (id, user_id, employer_name, emp_length, annual_income, job_title)

-- Bank Accounts
bank_accounts (id, user_id, bank_name, account_number, account_holder_name)

-- Loan Applications
loan_applications (id, user_id,
                   loan_amnt, loan_intent, loan_grade,
                   loan_int_rate, loan_percent_income, tenure_months,
                   ml_score, confidence,
                   loan_status,          -- pending / scoring / approved / rejected / manual_review / disbursed / closed
                   reviewed_by,          -- FK to admins.id (set if confidence < 0.90)
                   review_status,        -- not_required / pending / approved / rejected
                   review_note,
                   reviewed_at,
                   disbursed_at, created_at)

-- Repayments
repayments (id, loan_id, due_date, amount, paid_at, status, penalty)

-- Credit History (internal, feeds ML model)
credit_history (id, user_id, default_on_file, cred_hist_length, updated_at)
```

---

## Environment Variables

```env
# backend/.env

# App
APP_ENV=development
SECRET_KEY=your_secret_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Database (MySQL via Laragon)
DATABASE_URL=mysql+pymysql://root@127.0.0.1:3306/loan_approval_db

# ML
MODEL_PATH=app/ml/best_model_gradient_boosting.pkl
ML_CONFIDENCE_THRESHOLD=0.90

# Cloudinary (image storage for KTP + selfie)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| User App | React Native, Expo SDK, Expo Router |
| Admin Panel | React, Vite |
| State Management | Zustand (user app) |
| API Client | Axios |
| Backend | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy + Alembic |
| Database | MySQL (via Laragon) |
| Auth | JWT (python-jose) + bcrypt |
| ML Serving | scikit-learn, pandas, pickle |
| Image Storage | Cloudinary |

---

## Development Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head             # run DB migrations → creates tables in loan_approval_db
uvicorn app.main:app --reload    # starts at http://localhost:8000
```

### User App
```bash
cd frontend/user
npm install
npx expo start
```

### Admin Panel
```bash
cd frontend/admin
npm install
npm run dev
```

---

## Key Business Rules

- Minimum applicant age: **21 years old**
- Maximum `loan_percent_income`: **0.4** (40% of monthly income)
- If ML confidence score < **0.90**, route to **admin manual review** queue instead of auto-deciding
- Loan grade is derived from ML confidence score:
  - A: ≥ 0.90 | B: ≥ 0.80 | C: ≥ 0.70 | D: ≥ 0.60 | E–G: below 0.60
- Applicants with `cb_person_default_on_file = Y` are **auto-rejected** regardless of model output
- `loan_percent_income` is always **calculated server-side**, never trusted from client input

---

## Notes for Claude

- The ML model is **pre-trained and fixed** — do not retrain it during API calls
- All monetary values are in **IDR (Indonesian Rupiah)**
- Categorical features must be **encoded exactly** as during training — always check the encoding map from the training notebook
- KTP/selfie images are stored as **Cloudinary URLs** in the DB, not as file paths or blobs
- This project is in **Indonesian fintech context** — refer to OJK regulations where relevant
- When generating new API routes, always follow the existing **router → service → model** pattern
- Database migrations must go through **Alembic**, never alter tables directly
- No Docker — run services locally (Laragon for MySQL, uvicorn for backend, Expo/Vite for frontends)
