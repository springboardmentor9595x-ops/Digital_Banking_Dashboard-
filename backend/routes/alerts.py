"""
Alerts API Router
View bill reminders and notifications with enhanced features
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract, delete
from datetime import datetime, date, timedelta

from auth.jwt_handler import get_current_user
from database import get_db
from model import (
    User,
    Alert,
    AlertType,
    Account,
    Budget,
    Bill,
    BillStatus,
    Transaction,
    TransactionType,
)
from routes.alerts_schema import AlertResponse


router = APIRouter(prefix="/alerts", tags=["Alerts"])


# ============================================
# Helper Functions for Alert Generation
# ============================================


async def check_low_balance_accounts(
    db: AsyncSession, user_id: int, threshold: float = 1000.0
):
    """Check for accounts with balance below threshold"""
    query = select(Account).where(
        Account.user_id == user_id, Account.balance < threshold
    )
    result = await db.execute(query)
    return result.scalars().all()


async def check_budget_exceeded(db: AsyncSession, user_id: int):
    """Check for budgets that have been exceeded"""
    # Get user's account IDs
    accounts_query = select(Account.id).where(Account.user_id == user_id)
    accounts_result = await db.execute(accounts_query)
    account_ids = [acc_id for acc_id, in accounts_result.fetchall()]

    if not account_ids:
        return []

    # Get all budgets for current month
    now = datetime.now()
    budgets_query = select(Budget).where(
        Budget.user_id == user_id, Budget.month == now.month, Budget.year == now.year
    )
    budgets_result = await db.execute(budgets_query)
    budgets = budgets_result.scalars().all()

    exceeded_budgets = []
    for budget in budgets:
        # Calculate actual spending
        spent_query = select(func.sum(Transaction.amount)).where(
            Transaction.account_id.in_(account_ids),
            Transaction.category == budget.category,
            Transaction.txn_type == TransactionType.debit,
            extract("month", Transaction.txn_date) == now.month,
            extract("year", Transaction.txn_date) == now.year,
        )
        spent_result = await db.execute(spent_query)
        spent = float(spent_result.scalar() or 0)

        if spent > float(budget.limit_amount):
            exceeded_budgets.append({"budget": budget, "spent": spent})

    return exceeded_budgets


async def check_upcoming_bills(db: AsyncSession, user_id: int, days_ahead: int = 7):
    """Check for bills due in next N days"""
    today = date.today()
    future_date = today + timedelta(days=days_ahead)

    query = select(Bill).where(
        Bill.user_id == user_id,
        Bill.status.in_([BillStatus.upcoming, BillStatus.overdue]),
        Bill.due_date >= today,
        Bill.due_date <= future_date,
    )
    result = await db.execute(query)
    return result.scalars().all()


async def alert_exists(
    db: AsyncSession, user_id: int, alert_type: AlertType, message_contains: str
):
    """Check if similar alert already exists today"""
    today = datetime.now().date()

    query = select(Alert).where(
        Alert.user_id == user_id,
        Alert.alert_type == alert_type,
        Alert.message.contains(message_contains),
        func.date(Alert.created_at) == today,
    )
    result = await db.execute(query)
    return result.scalars().first() is not None


async def generate_alerts(db: AsyncSession, user_id: int):
    """Generate all types of alerts for a user"""
    alerts_created = 0

    # 1. Low Balance Alerts
    low_balance_accounts = await check_low_balance_accounts(db, user_id)
    for account in low_balance_accounts:
        message = f"Low balance alert: {account.bank_name} account has only ₹{float(account.balance):.2f} remaining"
        # FIXED: Use AlertType.low_balance (with underscore)
        if not await alert_exists(
            db, user_id, AlertType.low_balance, account.bank_name
        ):
            alert = Alert(
                user_id=user_id,
                alert_type=AlertType.low_balance,  # FIXED
                message=message,
                read_status=False,
            )
            db.add(alert)
            alerts_created += 1

    # 2. Budget Exceeded Alerts
    exceeded_budgets = await check_budget_exceeded(db, user_id)
    for item in exceeded_budgets:
        budget = item["budget"]
        spent = item["spent"]
        message = f"Budget exceeded: You've spent ₹{spent:.2f} on {budget.category}, which is ₹{spent - float(budget.limit_amount):.2f} over your ₹{float(budget.limit_amount):.2f} limit"
        # FIXED: Use AlertType.budget_exceeded (with underscore)
        if not await alert_exists(
            db, user_id, AlertType.budget_exceeded, budget.category
        ):
            alert = Alert(
                user_id=user_id,
                alert_type=AlertType.budget_exceeded,  # FIXED
                message=message,
                read_status=False,
            )
            db.add(alert)
            alerts_created += 1

    # 3. Bill Due Alerts
    upcoming_bills = await check_upcoming_bills(db, user_id)
    for bill in upcoming_bills:
        days_until = (bill.due_date - date.today()).days
        message = f"Bill reminder: {bill.biller_name} payment of ₹{float(bill.amount_due):.2f} is due in {days_until} day(s) on {bill.due_date}"
        # FIXED: Use AlertType.bill_due (with underscore)
        if not await alert_exists(db, user_id, AlertType.bill_due, bill.biller_name):
            alert = Alert(
                user_id=user_id,
                alert_type=AlertType.bill_due,  # FIXED
                message=message,
                read_status=False,
            )
            db.add(alert)
            alerts_created += 1

    if alerts_created > 0:
        await db.commit()

    return alerts_created


# ============================================
# API Endpoints
# ============================================

# ============================================
# API Endpoints
# ============================================


@router.get("/", response_model=List[AlertResponse])
async def list_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all alerts — auto-generates new ones before fetching"""
    await generate_alerts(db, current_user.id)
    query = (
        select(Alert)
        .where(Alert.user_id == current_user.id)
        .order_by(Alert.created_at.desc())
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/unread/count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get count of unread alerts"""
    query = select(func.count(Alert.id)).where(
        Alert.user_id == current_user.id, Alert.read_status == False
    )
    result = await db.execute(query)
    return {"unread_count": result.scalar()}


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def trigger_alert_generation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually trigger alert generation"""
    alerts_created = await generate_alerts(db, current_user.id)
    return {
        "message": f"Generated {alerts_created} new alerts",
        "alerts_created": alerts_created,
    }


@router.patch("/{alert_id}/read")
async def mark_alert_as_read(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a single alert as read"""
    query = select(Alert).where(Alert.id == alert_id, Alert.user_id == current_user.id)
    result = await db.execute(query)
    alert = result.scalars().first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found"
        )

    alert.read_status = True
    await db.commit()
    await db.refresh(alert)
    return {"message": "Alert marked as read", "alert_id": alert_id}


# ✅ STATIC ROUTE — must be BEFORE /{alert_id}
@router.delete("/clear-all", status_code=status.HTTP_200_OK)
async def clear_all_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete all alerts for the current user"""
    delete_stmt = delete(Alert).where(Alert.user_id == current_user.id)
    result = await db.execute(delete_stmt)
    await db.commit()
    return {
        "message": f"Cleared {result.rowcount} alert(s)",
        "deleted_count": result.rowcount,
    }


# ✅ PARAMETERIZED ROUTE — must be AFTER all static routes
@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a single alert"""
    query = select(Alert).where(Alert.id == alert_id, Alert.user_id == current_user.id)
    result = await db.execute(query)
    alert = result.scalars().first()

    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found"
        )

    await db.delete(alert)
    await db.commit()
