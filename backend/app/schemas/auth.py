from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class OTPVerify(BaseModel):
    phone: str
    code: str


class TokenRefresh(BaseModel):
    refresh_token: str
