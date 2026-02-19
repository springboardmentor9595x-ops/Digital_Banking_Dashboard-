from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.models.transaction import Transaction
from app.models.account import Account


# ==============================
# 1️⃣ MONTHLY CASH FLOW
# ==============================
def calculate_monthly_cashflow(db: Session, user_id: int):
    now = datetime.utcnow()
    start_month = datetime(now.year, now.month, 1)

    # MONEY INTO USER ACCOUNTS
    total_credits = db.query(func.sum(Transaction.amount)) \
        .join(Account, Transaction.to_account_id == Account.id) \
        .filter(
            Account.owner_id == user_id,
            Transaction.created_at >= start_month
        ).scalar() or 0

    # MONEY OUT FROM USER ACCOUNTS
    total_debits = db.query(func.sum(Transaction.amount)) \
        .join(Account, Transaction.from_account_id == Account.id) \
        .filter(
            Account.owner_id == user_id,
            Transaction.created_at >= start_month
        ).scalar() or 0

    return {
        "total_credits": float(total_credits),
        "total_debits": float(total_debits),
        "net_savings": float(total_credits - total_debits)
    }


# ==============================
# 2️⃣ TOP MERCHANTS (DEBIT ONLY - FIXED)
# ==============================
def get_top_merchants(db: Session, user_id: int):

    # Get all user accounts
    accounts = db.query(Account).filter(Account.owner_id == user_id).all()
    account_ids = [acc.id for acc in accounts]

    if not account_ids:
        return []

    results = (
        db.query(
            func.coalesce(Transaction.merchant, Transaction.description).label("merchant"),
            func.sum(Transaction.amount).label("total")
        )
        .filter(
            Transaction.from_account_id.in_(account_ids),
            Transaction.category != "Transfer"   # 🚫 exclude transfers
        )
        .group_by(func.coalesce(Transaction.merchant, Transaction.description))
        .order_by(func.sum(Transaction.amount).desc())
        .limit(5)
        .all()
    )

    return [
        {
            "merchant": r.merchant if r.merchant else "Unknown",
            "total": float(r.total)
        }
        for r in results
    ]


# ==============================
# 3️⃣ CATEGORY SPENDING SUMMARY (DEBIT ONLY)
# ==============================
def category_spending_summary(db: Session, user_id: int):
    results = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total")
    ).join(Account, Transaction.from_account_id == Account.id) \
     .filter(
        Account.owner_id == user_id,
        Transaction.category != "Transfer"   # 🚫 exclude transfers
     ).group_by(Transaction.category) \
      .all()

    return [
        {
            "category": r[0] if r[0] else "Other",
            "total": float(r[1])
        }
        for r in results
    ]


# ==============================
# 4️⃣ FINANCIAL HEALTH SCORE (FIXED)
# ==============================
def calculate_burn_rate(db: Session, user_id: int):

    # Total income
    total_income = db.query(func.sum(Transaction.amount)) \
        .join(Account, Transaction.to_account_id == Account.id) \
        .filter(
            Account.owner_id == user_id,
            Transaction.category != "Transfer"
        ).scalar() or 0

    # Total expense
    total_expense = db.query(func.sum(Transaction.amount)) \
        .join(Account, Transaction.from_account_id == Account.id) \
        .filter(
            Account.owner_id == user_id,
            Transaction.category != "Transfer"
        ).scalar() or 0

    if total_income <= 0:
        health_score = 0
    else:
        savings_ratio = (total_income - total_expense) / total_income
        health_score = max(0, min(100, savings_ratio * 100))

    return round(float(health_score), 1)
