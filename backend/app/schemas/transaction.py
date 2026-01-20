from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal
# from typing import Optional

class TransactionCreate(BaseModel):
    account_id: int
    description: str
    category: str
    amount: Decimal
    currency: str
    txn_type: str
    merchant: str | None = None
    # txn_date: datetime
    # posted_date: datetime | None = None

class TransactionOut(BaseModel): #I have created this for controlled response
    id: int
    account_id: int
    description: str
    category: str
    amount: Decimal
    currency: str
    txn_type: str
    merchant: str | None
    txn_date: datetime
    posted_date: datetime | None
    # created_at: datetime

    class Config:
        from_attributes = True
