from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class AccountBase(BaseModel):
    """Common fields for accounts input validation"""

    bank_name: str = Field(..., min_length=2, max_length=100)
    # Must match one of the DB enum values: 'savings','checking','credit_card','loan','investment'
    account_type: str = Field(
        ...,
        pattern="^(savings|checking|credit_card|loan|investment)$"
    )
    masked_account: Optional[str] = Field(
        None,
        min_length=4,
        max_length=20,
        description="Last 4–6 digits or masked form like ****1234"
    )
    currency: str = Field(
        "INR",
        pattern="^[A-Z]{3}$",
        description="3-letter ISO code like INR, USD, EUR"
    )
    balance: float = Field(
        0.0,
        ge=0,
        description="Initial account balance, cannot be negative"
    )


class AccountCreate(AccountBase):
    """Schema for account creation request"""

    pass


class AccountUpdate(AccountBase):
    """Schema for updating an account"""

    pass


class AccountResponse(BaseModel):
    """Schema for account details in responses"""

    id: int
    bank_name: str
    account_type: str
    masked_account: Optional[str]
    currency: str
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True