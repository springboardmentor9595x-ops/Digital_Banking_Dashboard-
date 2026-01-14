from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    description: Optional[str] = Field(None, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    amount: float = Field(..., gt=0, description="Amount must be positive")
    currency: str = Field(
        "INR", pattern="^[A-Z]{3}$", description="3-letter code like INR, USD"
    )
    txn_type: str = Field(
        ..., pattern="^(debit|credit)$", description="Must be 'debit' or 'credit'"
    )
    merchant: Optional[str] = Field(None, max_length=50)
    txn_date: datetime
    posted_date: Optional[datetime] = None

class TransactionCreate(TransactionBase):
    account_id: int = Field(..., gt=0)

class TransactionResponse(BaseModel):
    id: int
    account_id: int
    description: Optional[str]
    category: Optional[str]
    amount: float
    currency: str
    txn_type: str
    merchant: Optional[str]
    txn_date: datetime
    posted_date: Optional[datetime]

    class Config:
        from_attributes = True
