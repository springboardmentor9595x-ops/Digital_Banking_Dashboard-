from pydantic import BaseModel
from typing import List
from ..routes.accounts_schema import AccountResponse


class DashboardUser(BaseModel):
    name: str
    email: str


class DashboardSummary(BaseModel):
    total_balance: float
    total_accounts: int
    total_income: float
    total_expenses: float


class DashboardResponse(BaseModel):
    user: DashboardUser
    summary: DashboardSummary
    accounts: List[AccountResponse]
    transactions: list  # we’ll refine later
