from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_admin
from app.models.admin import Admin
from app.schemas.admin import (
    AdminKYCListItem,
    AdminLoanListItem,
    AdminLoginRequest,
    AdminTokenResponse,
    KYCReviewRequest,
    LoanReviewRequest,
    PaginatedUsers,
)
from app.services import auth_service, admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/auth/login", response_model=AdminTokenResponse)
def admin_login(data: AdminLoginRequest, db: Session = Depends(get_db)):
    return auth_service.admin_login(db, str(data.email), data.password)


# ── KYC ──────────────────────────────────────────────────────────────────────

@router.get("/kyc/pending", response_model=list[AdminKYCListItem])
def list_pending_kyc(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return admin_service.list_pending_kyc(db)


@router.put("/kyc/{kyc_id}/review", response_model=AdminKYCListItem)
def review_kyc(
    kyc_id: int,
    data: KYCReviewRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return admin_service.review_kyc(db, admin, kyc_id, data)


# ── Loans ─────────────────────────────────────────────────────────────────────

@router.get("/loans/pending", response_model=list[AdminLoanListItem])
def list_pending_loans(
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return admin_service.list_pending_loans(db)


@router.put("/loans/{loan_id}/review", response_model=AdminLoanListItem)
def review_loan(
    loan_id: int,
    data: LoanReviewRequest,
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return admin_service.review_loan(db, admin, loan_id, data)


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=PaginatedUsers)
def list_users(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return admin_service.list_users(db, page, page_size)
