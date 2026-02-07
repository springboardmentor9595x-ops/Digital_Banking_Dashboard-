from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from typing import Optional

from app.db.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.category_rule import CategoryRule
from app.models.user import User
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.core.security import get_current_user
from app.services.budgets_service import calculate_spent

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# ================= HELPER FUNCTIONS =================

def auto_categorize(description: Optional[str], db: Session, user_id: int) -> str:
    if not description:
        return "Others"

    description_lower = description.lower()
    rules = db.query(CategoryRule).filter(CategoryRule.user_id == user_id).all()

    for rule in rules:
        keywords = [k.strip().lower() for k in rule.keywords.split(",")]
        if any(keyword in description_lower for keyword in keywords):
            return rule.category_name

    return "Others"


def check_budget_alert(db: Session, user_id: int, category: str, amount: float) -> Optional[str]:
    today = datetime.now()

    budget = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            Budget.category == category,
            Budget.month == today.month,
            Budget.year == today.year
        )
        .first()
    )

    if not budget:
        return None

    spent = calculate_spent(db, user_id, category, today.month, today.year)

    if spent + amount > budget.limit_amount:
        return f"⚠ Budget Alert: {category} exceeded"

    return None


# ================= CREATE TRANSACTION =================

@router.post("/", response_model=dict)
def create_transaction(
    txn: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sender = db.query(Account).filter(Account.id == txn.from_account_id).first()
    receiver = db.query(Account).filter(Account.id == txn.to_account_id).first()

    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="Account not found")

    if sender.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized")

    if sender.balance < txn.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    category = txn.category or auto_categorize(txn.description, db, current_user.id)
    budget_alert = check_budget_alert(db, current_user.id, category, txn.amount)

    sender.balance -= txn.amount
    receiver.balance += txn.amount

    transaction = Transaction(
        from_account_id=sender.id,
        to_account_id=receiver.id,
        amount=txn.amount,
        currency=sender.currency,
        status="SUCCESS",
        description=txn.description or "Transfer",
        category=category,

        # ✅ THIS IS THE FIX — USE USER-SELECTED DATE
        transaction_date=txn.date,

        # 🔴 KEEP SYSTEM TIMESTAMP (DO NOT REMOVE)
        created_at=datetime.utcnow()
    )


    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    # 🔄 UPDATE BUDGET SPENT
    budget = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.category == transaction.category,
            Budget.month == transaction.created_at.month,
            Budget.year == transaction.created_at.year
        )
        .first()
    )

    if budget:
        budget.spent = calculate_spent(
            db,
            current_user.id,
            transaction.category,
            transaction.created_at.month,
            transaction.created_at.year
        )
        db.commit()

    response = {
        "id": transaction.id,
        "amount": transaction.amount,
        "description": transaction.description,
        "category": transaction.category,
        "created_at": transaction.created_at.isoformat()
    }

    if budget_alert:
        response["budget_alert"] = budget_alert

    return response


# ================= DASHBOARD SUMMARY =================

@router.get("/dashboard/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accounts = db.query(Account).filter(Account.owner_id == current_user.id).all()
    account_ids = [a.id for a in accounts]

    total_balance = sum(a.balance for a in accounts)

    income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.to_account_id.in_(account_ids))
        .scalar()
    )

    expense = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.from_account_id.in_(account_ids))
        .scalar()
    )

    return {
        "total_balance": total_balance,
        "total_income": income,
        "total_expenses": expense
    }


# ================= DASHBOARD RECENT (FIXED) =================
@router.get("/dashboard")
def get_dashboard_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accounts = db.query(Account).filter(Account.owner_id == current_user.id).all()
    account_ids = [a.id for a in accounts]

    txs = (
        db.query(Transaction)
        .filter(
            (Transaction.from_account_id.in_(account_ids)) |
            (Transaction.to_account_id.in_(account_ids))
        )
        .order_by(Transaction.created_at.desc())  # ✅ FIXED
        .limit(5)                                # ✅ ONLY LATEST 5
        .all()
    )

    return {
        "recent_transactions": [
            {
                "id": tx.id,
                "created_at": tx.created_at.isoformat(),  # ✅ CONSISTENT
                "description": tx.description,
                "amount": tx.amount,
                "type": "DEBIT" if tx.from_account_id in account_ids else "CREDIT"
            }
            for tx in txs
        ]
    }

# ================= ALL TRANSACTIONS (FIXED) =================

@router.get("/", response_model=list[TransactionResponse])
def get_all_transactions(
    account_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accounts = db.query(Account).filter(Account.owner_id == current_user.id).all()
    account_ids = [a.id for a in accounts]

    query = db.query(Transaction).filter(
        (Transaction.from_account_id.in_(account_ids)) |
        (Transaction.to_account_id.in_(account_ids))
    )

    if account_id:
        query = query.filter(
            (Transaction.from_account_id == account_id) |
            (Transaction.to_account_id == account_id)
        )

    return query.order_by(Transaction.created_at.desc()).all() # ✅ FIX


# ================= ACCOUNT-SPECIFIC =================

@router.get("/by-account")
def get_transactions_by_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = (
        db.query(Account)
        .filter(Account.id == account_id, Account.owner_id == current_user.id)
        .first()
    )

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    txs = (
        db.query(Transaction)
        .filter(
            (Transaction.from_account_id == account_id) |
            (Transaction.to_account_id == account_id)
        )
        .order_by(Transaction.created_at.desc()) # ✅ FIX
        .all()
    )

    return [
        {
            "id": tx.id,
            "created_at": tx.created_at.isoformat(),
            "description": tx.description,
            "amount": tx.amount,
            "type": "DEBIT" if tx.from_account_id == account_id else "CREDIT"
        }
        for tx in txs
    ]


# ================= HISTORY (FIXED) =================

@router.get("/my-history")
def get_my_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accounts = db.query(Account).filter(Account.owner_id == current_user.id).all()
    account_ids = [acc.id for acc in accounts]

    if not account_ids:
        return {"transactions": []}

    transactions = (
        db.query(Transaction)
        .filter(
            (Transaction.from_account_id.in_(account_ids)) |
            (Transaction.to_account_id.in_(account_ids))
        )
        .order_by(Transaction.id.desc())   # ✅ SAME AS HISTORY
        .all()
    )

    result = []

    for tx in transactions:
        is_debit = tx.from_account_id in account_ids
        account = tx.from_account if is_debit else tx.to_account

        result.append({
            "id": tx.id,
            "date": tx.created_at.isoformat() if tx.created_at else None,
            "description": tx.description or "-",
            "bank_name": account.bank_name if account else "-",
            "category": tx.category or "Others",
            "type": "DEBIT" if is_debit else "CREDIT",
            "amount": tx.amount
        })

    return {"transactions": result}
