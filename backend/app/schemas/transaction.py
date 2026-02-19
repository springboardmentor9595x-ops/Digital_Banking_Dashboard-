from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from datetime import date


class TransactionCreate(BaseModel):
    from_account_id: int
    to_account_id: Optional[int] = None   # ✅ already correct
    amount: float
    description: Optional[str] = None
    merchant: Optional[str] = None
    category: Optional[str] = "Others"
    date: date   # keep as date (DO NOT change)


class TransactionOut(BaseModel):
    id: int
    from_account_id: int
    to_account_id: Optional[int] = None
    amount: float
    currency: str
    status: str
    description: Optional[str] = None
    merchant: Optional[str] = None
    category: Optional[str] = "Others"

    # ✅ IMPORTANT FIX
    transaction_date: date

    model_config = {
        "from_attributes": True
    }


class CategoryUpdate(BaseModel):
    category: str


# ✅ BACKWARD COMPATIBILITY (IMPORTANT)
TransactionResponse = TransactionOut
