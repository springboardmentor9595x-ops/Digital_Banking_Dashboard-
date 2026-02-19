from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field


class BillBase(BaseModel):
    """Common bill fields"""

    biller_name: str = Field(
        ..., min_length=2, max_length=50, description="Name of biller (e.g., 'Airtel')"
    )
    due_date: date = Field(..., description="Bill due date (YYYY-MM-DD)")
    amount_due: float = Field(..., gt=0, description="Amount to pay")
    auto_pay: bool = Field(default=False, description="Enable auto-payment")


class BillCreate(BillBase):
    """Schema for creating a new bill"""

    pass


class BillUpdate(BaseModel):
    """Schema for updating bill (all fields optional)"""

    biller_name: Optional[str] = Field(None, min_length=2, max_length=50)
    due_date: Optional[date] = None
    amount_due: Optional[float] = Field(None, gt=0)
    auto_pay: Optional[bool] = None
    status: Optional[str] = Field(
        None,
        pattern="^(upcoming|paid|overdue)$",
        description="Manually set status (usually to 'paid')",
    )


class BillResponse(BaseModel):
    """Schema for bill in API responses"""

    id: int
    user_id: int
    biller_name: str
    due_date: date
    amount_due: float
    status: str  # Will be enum value as string
    auto_pay: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Allows ORM object conversion
