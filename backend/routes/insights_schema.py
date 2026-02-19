"""
Pydantic schemas for Insights Module
"""

from pydantic import BaseModel
from typing import List, Dict


class MerchantSpending(BaseModel):
    """Schema for merchant spending data"""

    merchant: str
    total_spent: float


class CategorySpending(BaseModel):
    """Schema for category spending data"""

    category: str
    total_spent: float


class InsightsResponse(BaseModel):
    """Complete insights response"""

    monthly_cash_flow: Dict[str, float]  # {total_credits, total_debits, net_savings}
    top_merchants: List[MerchantSpending]
    category_spending: List[CategorySpending]
    burn_rate: float
