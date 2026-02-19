"""
Pydantic schemas for Rewards Module
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RewardProgramCreate(BaseModel):
    """Schema for creating a new reward program"""

    program_name: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="Loyalty program name (e.g., HDFC Rewards)",
    )
    points_balance: int = Field(default=0, ge=0, description="Initial points balance")


class RewardPointsUpdate(BaseModel):
    """Schema for updating reward points"""

    points_to_add: int = Field(
        ..., description="Points to add (positive) or deduct (negative)"
    )

    class Config:
        json_schema_extra = {"example": {"points_to_add": 500}}  # Add 500 points


class RewardResponse(BaseModel):
    """Schema for reward program in API responses"""

    id: int
    user_id: int
    program_name: str
    points_balance: int
    last_updated: datetime

    # Currency conversion fields (calculated dynamically)
    points_value_inr: Optional[float] = Field(
        None, description="Points value in Indian Rupees"
    )
    points_value_usd: Optional[float] = Field(
        None, description="Points value in US Dollars"
    )
    points_value_eur: Optional[float] = Field(None, description="Points value in Euros")

    class Config:
        from_attributes = True  # Allows Pydantic to read from SQLAlchemy models


class RewardSummary(BaseModel):
    """Summary of all reward programs for a user"""

    total_programs: int
    total_points: int
    total_value_inr: float
    total_value_usd: float
    total_value_eur: float
