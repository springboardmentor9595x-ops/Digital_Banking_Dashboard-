from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# ==========================================
# INDIVIDUAL PIECES (Building Blocks)
# ==========================================


class DashboardAccountResponse(BaseModel):
    """
    Single account information for dashboard.
    Same as AccountResponse but may have extra fields later.
    """

    id: int
    bank_name: str
    account_type: str
    masked_account: Optional[str]
    currency: str
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardTransactionResponse(BaseModel):
    """
    Single transaction for recent activity feed.
    """

    id: int
    account_id: int
    description: Optional[str]
    category: Optional[str]
    amount: float
    currency: str
    txn_type: str  # "debit" or "credit"
    merchant: Optional[str]
    txn_date: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    """
    Aggregated statistics calculated from accounts + transactions.
    WHY: Frontend needs these for summary cards at the top.
    """

    total_accounts: int  # Count of user's accounts
    total_balance: float  # Sum of all account balances
    total_income: float  # Sum of all CREDIT transactions
    total_expenses: float  # Sum of all DEBIT transactions
    net_flow: float  # Income - Expenses


class DashboardUserInfo(BaseModel):
    """
    User profile info for welcome message.
    WHY: Frontend shows "Welcome back, {name}!"
    """

    id: int
    name: str
    email: str


# ==========================================
# FINAL AGGREGATED RESPONSE
# ==========================================


class DashboardOverviewResponse(BaseModel):
    """
    COMPLETE dashboard data returned to frontend.

    BIG PICTURE:
    This is what React receives in one API call.
    Everything needed to render the entire dashboard page.
    """

    user: DashboardUserInfo  # "Welcome back, John!"
    accounts: List[DashboardAccountResponse]  # All account cards
    transactions: List[DashboardTransactionResponse]  # Recent activity list
    summary: DashboardSummary  # Summary statistics
