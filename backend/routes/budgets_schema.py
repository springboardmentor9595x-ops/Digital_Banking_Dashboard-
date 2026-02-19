"""
Pydantic schemas for budget-related endpoints
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BudgetCreate(BaseModel):
    """Schema for creating a new budget"""

    month: int = Field(..., ge=1, le=12, description="Month (1-12)")
    year: int = Field(..., ge=2000, le=2100, description="Year (e.g., 2026)")
    category: str = Field(
        ..., min_length=2, max_length=50, description="Budget category"
    )
    limit_amount: float = Field(..., gt=0, description="Budget limit")


class BudgetUpdate(BaseModel):
    """Schema for updating a budget"""

    limit_amount: float = Field(..., gt=0, description="New budget limit")


class BudgetResponse(BaseModel):
    """Schema for budget details in responses"""

    id: int
    user_id: int
    month: int
    year: int
    category: str
    limit_amount: float
    spent_amount: float
    remaining: float
    is_over_budget: bool
    created_at: datetime

    class Config:
        from_attributes = True


class BudgetSummary(BaseModel):
    """Summary of budget status"""

    budget_id: int
    category: str
    month: int
    year: int
    limit_amount: float
    spent_amount: float
    remaining: float
    is_over_budget: bool
    percentage_used: float
