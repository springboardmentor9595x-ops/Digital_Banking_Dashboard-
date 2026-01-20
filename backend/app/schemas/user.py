from pydantic import BaseModel, EmailStr
from typing import Literal

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str | None = None
    kyc_status: Literal["verified", "unverified"] = "unverified"

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
