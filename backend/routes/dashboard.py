from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from ..auth.jwt_handler import get_current_user
from ..database import get_db
from ..model import User, Account, Transaction, TransactionType
from ..routes.dashboard_schema import (
    DashboardOverviewResponse,
    DashboardUserInfo,
    DashboardAccountResponse,
    DashboardTransactionResponse,
    DashboardSummary,
)

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ==========================================
# MAIN ENDPOINT: Complete Dashboard Overview
# ==========================================


@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get complete dashboard data for authenticated user.

    WHAT IT DOES:
    1. Validates user is logged in (via JWT token)
    2. Fetches all user's accounts from database
    3. Fetches all user's transactions from database
    4. Calculates summary statistics (income, expenses, balance)
    5. Returns everything in ONE response

    BIG PICTURE:
    Frontend calls this ONCE when dashboard page loads.
    No need for multiple API calls!

    SECURITY:
    - Requires valid JWT token (get_current_user dependency)
    - Only returns data belonging to logged-in user
    - No sensitive data exposed (passwords filtered out)
    """

    # ==========================================
    # STEP 1: Get User Info
    # ==========================================
    # WHY: Frontend needs name for "Welcome back, {name}!"
    user_info = DashboardUserInfo(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
    )

    # ==========================================
    # STEP 2: Get All User's Accounts
    # ==========================================
    # WHY: Display account cards in dashboard grid
    accounts_query = select(Account).where(Account.user_id == current_user.id)
    accounts_result = await db.execute(accounts_query)
    accounts = accounts_result.scalars().all()

    # Convert ORM objects to Pydantic models for response
    account_responses = [
        DashboardAccountResponse(
            id=acc.id,
            bank_name=acc.bank_name,
            account_type=acc.account_type.value,  # Convert enum to string
            masked_account=acc.masked_account,
            currency=acc.currency,
            balance=float(acc.balance),  # Convert Decimal to float
            created_at=acc.created_at,
        )
        for acc in accounts
    ]

    # ==========================================
    # STEP 3: Get Recent Transactions
    # ==========================================
    # WHY: Display "Recent Activity" list in dashboard

    # First, get all account IDs belonging to this user
    # (Security: ensures we only fetch transactions from user's accounts)
    account_ids = [acc.id for acc in accounts]

    if account_ids:
        # Fetch last 10 transactions across ALL user's accounts
        transactions_query = (
            select(Transaction)
            .where(Transaction.account_id.in_(account_ids))
            .order_by(Transaction.txn_date.desc())  # Most recent first
            .limit(10)  # Only last 10 for dashboard
        )
        transactions_result = await db.execute(transactions_query)
        transactions = transactions_result.scalars().all()

        transaction_responses = [
            DashboardTransactionResponse(
                id=txn.id,
                account_id=txn.account_id,
                description=txn.description,
                category=txn.category,
                amount=float(txn.amount),
                currency=txn.currency,
                txn_type=txn.txn_type.value,  # Convert enum to string
                merchant=txn.merchant,
                txn_date=txn.txn_date,
            )
            for txn in transactions
        ]
    else:
        # User has no accounts yet
        transaction_responses = []

    # ==========================================
    # STEP 4: Calculate Summary Statistics
    # ==========================================
    # WHY: Display summary cards (Total Balance, Income, Expenses)

    # Calculate total balance across all accounts
    total_balance = sum(float(acc.balance) for acc in accounts)

    if account_ids:
        # Calculate total INCOME (all CREDIT transactions)
        income_query = select(func.sum(Transaction.amount)).where(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == TransactionType.credit,
        )
        income_result = await db.execute(income_query)
        total_income = income_result.scalar() or 0  # Default to 0 if None

        # Calculate total EXPENSES (all DEBIT transactions)
        expenses_query = select(func.sum(Transaction.amount)).where(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == TransactionType.debit,
        )
        expenses_result = await db.execute(expenses_query)
        total_expenses = expenses_result.scalar() or 0  # Default to 0 if None
    else:
        # User has no accounts, so no income/expenses
        total_income = 0
        total_expenses = 0

    # Net flow = Income - Expenses (positive = saving, negative = spending more)
    net_flow = float(total_income) - float(total_expenses)

    summary = DashboardSummary(
        total_accounts=len(accounts),
        total_balance=total_balance,
        total_income=float(total_income),
        total_expenses=float(total_expenses),
        net_flow=net_flow,
    )

    # ==========================================
    # STEP 5: Combine Everything and Return
    # ==========================================
    return DashboardOverviewResponse(
        user=user_info,
        accounts=account_responses,
        transactions=transaction_responses,
        summary=summary,
    )


# ==========================================
# BONUS ENDPOINT: Accounts with Stats
# ==========================================


@router.get("/accounts-with-stats")
async def get_accounts_with_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all accounts with individual transaction statistics.

    WHY: If frontend wants per-account breakdown instead of total.

    EXAMPLE RESPONSE:
    [
        {
            "account": { "id": 1, "bank_name": "HDFC", ... },
            "stats": {
                "total_income": 50000,
                "total_expenses": 30000,
                "transaction_count": 45
            }
        }
    ]
    """
    accounts_query = select(Account).where(Account.user_id == current_user.id)
    accounts_result = await db.execute(accounts_query)
    accounts = accounts_result.scalars().all()

    result = []
    for account in accounts:
        # Get income for this account
        income_query = select(func.sum(Transaction.amount)).where(
            Transaction.account_id == account.id,
            Transaction.txn_type == TransactionType.credit,
        )
        income_result = await db.execute(income_query)
        total_income = income_result.scalar() or 0

        # Get expenses for this account
        expenses_query = select(func.sum(Transaction.amount)).where(
            Transaction.account_id == account.id,
            Transaction.txn_type == TransactionType.debit,
        )
        expenses_result = await db.execute(expenses_query)
        total_expenses = expenses_result.scalar() or 0

        # Count transactions
        count_query = select(func.count(Transaction.id)).where(
            Transaction.account_id == account.id
        )
        count_result = await db.execute(count_query)
        txn_count = count_result.scalar()

        result.append(
            {
                "account": DashboardAccountResponse(
                    id=account.id,
                    bank_name=account.bank_name,
                    account_type=account.account_type.value,
                    masked_account=account.masked_account,
                    currency=account.currency,
                    balance=float(account.balance),
                    created_at=account.created_at,
                ),
                "stats": {
                    "total_income": float(total_income),
                    "total_expenses": float(total_expenses),
                    "transaction_count": txn_count,
                    "net_flow": float(total_income) - float(total_expenses),
                },
            }
        )

    return result
