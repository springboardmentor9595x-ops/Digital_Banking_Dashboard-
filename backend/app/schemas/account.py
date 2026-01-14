from pydantic import BaseModel
from typing import Optional


# =========================
# BASE SCHEMA
# =========================
class AccountBase(BaseModel):
    account_type: Optional[str] = None
    currency: Optional[str] = None


# =========================
# CREATE ACCOUNT
# =========================
class AccountCreate(AccountBase):
    account_type: str
    balance: float
    currency: str


# =========================
# UPDATE ACCOUNT
# =========================
class AccountUpdate(AccountBase):
    pass


# =========================
# RESPONSE SCHEMA
# =========================
class AccountOut(BaseModel):
    id: int
    account_type: str
    balance: float
    currency: str

    class Config:
        from_attributes = True

