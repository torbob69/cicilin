from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.admin import AdminLoginRequest, AdminTokenResponse
from app.services import auth_service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/auth/login", response_model=AdminTokenResponse)
def admin_login(data: AdminLoginRequest, db: Session = Depends(get_db)):
    return auth_service.admin_login(db, str(data.email), data.password)

# ── KYC, Loan, and User management endpoints added on Day 12 ──────────────────
