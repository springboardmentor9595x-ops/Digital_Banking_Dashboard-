from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from datetime import date

class TransactionCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float
    description: Optional[str] = None
    category: Optional[str] = "Others"
    date: date   # ✅ REQUIRED


class TransactionOut(BaseModel):
    id: int
    from_account_id: int
    to_account_id: int
    amount: float
    currency: str
    status: str
    description: Optional[str] = None
    category: Optional[str] = "Others"
    date: Optional[datetime] = None

    class Config:
        from_attributes = True


class CategoryUpdate(BaseModel):
    category: str


# ✅ BACKWARD COMPATIBILITY (IMPORTANT)
TransactionResponse = TransactionOut
