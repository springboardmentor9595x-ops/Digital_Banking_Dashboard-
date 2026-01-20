from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime

class AccountCreate(BaseModel):
    bank_name: str = Field(..., min_length=2, max_length=100)
    
    account_type: Literal[
        "savings", "current", "credit_card", "loan", "investment"]
    
    masked_account: str = Field(..., min_length=4, max_length=12,
                                description="Masked account numberlike XXXX1234")
    
    currency: str = Field(..., min_length=3, max_length=3,
                          description="Currency code like INR, USD")
    
    balance: float = Field(..., ge=0)

class AccountOut(BaseModel):
    id: int
    user_id: int
    bank_name: str
    account_type: str
    masked_account: str
    currency: str
    # created_at: datetime
    balance: float
    
    class Config:
        from_attributes = True