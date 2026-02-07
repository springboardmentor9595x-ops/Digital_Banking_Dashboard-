from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.transaction import Transaction
from app.models.account import Account


def calculate_spent(
    db: Session,
    user_id: int,
    category: str,
    month: int,
    year: int,
):
    # 1️⃣ Get user's account IDs
    account_ids = [
        acc.id
        for acc in db.query(Account)
        .filter(Account.owner_id == user_id)
        .all()
    ]

    if not account_ids:
        return 0

    # 2️⃣ Sum ONLY expenses for SAME category + SAME month/year
    spent = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.from_account_id.in_(account_ids),
            Transaction.category == category,
            extract("month", Transaction.transaction_date) == month,
            extract("year", Transaction.transaction_date) == year,
        )
        .scalar()
    )

    return spent
