from sqlalchemy.orm import Session
from sqlalchemy import extract, func

from app.models.transaction import Transaction
from app.models.account import Account


def calculate_spent(
    db: Session,
    user_id: int,
    category: str,
    month: int,
    year: int
):
    """
    Calculate total DEBIT spent for a category
    in a given month/year for a user

    DEBIT = money going OUT
    => Transaction.from_account_id belongs to user's account
    """

    # 1️⃣ Get user's account IDs
    account_ids = (
        db.query(Account.id)
        .filter(Account.owner_id == user_id)
        .subquery()
    )

    # 2️⃣ Sum ONLY DEBIT transactions
    spent = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.from_account_id.in_(account_ids),  # ✅ DEBIT ONLY
            Transaction.category == category,
            extract("month", Transaction.created_at) == month,
            extract("year", Transaction.created_at) == year,
        )
        .scalar()
    )

    return spent
