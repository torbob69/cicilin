from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    phone: str
    email: EmailStr
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    address: Optional[str] = None
    home_ownership: Optional[str] = None
    date_of_birth: Optional[date] = None


class EmploymentCreate(BaseModel):
    employer_name: Optional[str] = None
    emp_length: Optional[float] = None
    annual_income: Optional[float] = None
    job_title: Optional[str] = None


class EmploymentResponse(BaseModel):
    employer_name: Optional[str] = None
    job_title: Optional[str] = None
    emp_length: Optional[float] = None
    annual_income: Optional[float] = None

    model_config = {"from_attributes": True}


class BankAccountCreate(BaseModel):
    bank_name: str
    account_number: str
    account_holder_name: str


class UserResponse(BaseModel):
    id: str
    phone: str
    email: str
    full_name: str
    nik: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    home_ownership: Optional[str] = None
    created_at: datetime
    employment: Optional[EmploymentResponse] = None

    model_config = {"from_attributes": True}


class BankAccountResponse(BaseModel):
    id: str
    bank_name: str
    account_number: str
    account_holder_name: str

    model_config = {"from_attributes": True}
