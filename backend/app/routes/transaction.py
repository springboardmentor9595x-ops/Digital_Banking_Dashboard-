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
from app.models.reward import Reward
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.core.security import get_current_user
from app.services.budgets_service import calculate_spent
from fastapi.responses import StreamingResponse
import csv
import io

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

def check_budget_alert(
    db: Session,
    user_id: int,
    category: str,
    amount: float,
    txn_date: datetime   # 👈 ADDED
) -> Optional[str]:

    budget = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            Budget.category == category,
            Budget.month == txn_date.month,   # ✅ FIXED
            Budget.year == txn_date.year      # ✅ FIXED
        )
        .first()
    )

    if not budget:
        return None

    spent = calculate_spent(
        db,
        user_id,
        category,
        txn_date.month,
        txn_date.year
    )

    if spent + amount > budget.limit_amount:
        from app.services.alerts_service import create_alert_if_not_exists

        create_alert_if_not_exists(
            db=db,
            user_id=user_id,
            alert_type="budget_exceeded",
            message=f"Budget exceeded for {category} ({txn_date.month}/{txn_date.year})"
        )

        return f"⚠ Budget Alert: {category} exceeded"

    return None


# ================= CREATE TRANSACTION =================

@router.post("/", response_model=dict)
def create_transaction(
    txn: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sender = None
    receiver = None

    if txn.from_account_id:
        sender = db.query(Account).filter(Account.id == txn.from_account_id).first()
        if not sender:
            raise HTTPException(status_code=404, detail="Sender account not found")
        if sender.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized")

    if txn.to_account_id:
        receiver = db.query(Account).filter(Account.id == txn.to_account_id).first()
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver account not found")


    category = txn.category or auto_categorize(txn.description, db, current_user.id)
    budget_alert = check_budget_alert(
        db,
        current_user.id,
        category,
        txn.amount,
        txn.date   # 👈 PASS TRANSACTION DATE
    )


    # External Expense (money leaving system)
    if sender and not receiver:
        if sender.balance < txn.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        sender.balance -= txn.amount

    # External Income (salary etc)
    elif receiver and not sender:
        receiver.balance += txn.amount

    # Internal Transfer (between two accounts)
    elif sender and receiver:
        if sender.balance < txn.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        sender.balance -= txn.amount
        receiver.balance += txn.amount

    else:
        raise HTTPException(status_code=400, detail="Invalid transaction")


    transaction = Transaction(
        from_account_id=txn.from_account_id,   # ✅ FIXED
        to_account_id=txn.to_account_id,       # ✅ FIXED
        amount=txn.amount,
        currency=sender.currency if sender else "INR",
        status="SUCCESS",
        description=txn.description,
        merchant=txn.merchant,
        category=category,
        transaction_date=txn.date,             # ✅ use request date
        created_at=datetime.utcnow()
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    # 🔔 Low Balance Alert (AFTER transaction commit)
    from app.services.alerts_service import create_alert_if_not_exists

    LOW_BALANCE_THRESHOLD = 1000  # change if needed

    if sender.balance < LOW_BALANCE_THRESHOLD:
        create_alert_if_not_exists(
            db=db,
            user_id=current_user.id,
            alert_type="low_balance",
            message=f"Low balance in account {sender.account_number}"
        )
        # ================= REWARD SYSTEM =================

    # 🎯 1% Base reward for ALL transactions
    base_points = int(transaction.amount * 0.01)

    credit_reward = db.query(Reward).filter(
        Reward.user_id == current_user.id,
        Reward.program_name == "Credit Card Rewards"
    ).first()

    if not credit_reward:
        credit_reward = Reward(
            program_name="Credit Card Rewards",
            points_balance=0,
            user_id=current_user.id
        )
        db.add(credit_reward)

    credit_reward.points_balance += base_points


    # 🎁 Category Bonus Rewards
    category_lower = (transaction.category or "").lower()

    def add_bonus(program_name: str, percent: float):
        bonus_points = int(transaction.amount * percent)

        reward = db.query(Reward).filter(
            Reward.user_id == current_user.id,
            Reward.program_name == program_name
        ).first()

        if not reward:
            reward = Reward(
                program_name=program_name,
                points_balance=0,
                user_id=current_user.id
            )
            db.add(reward)

        reward.points_balance += bonus_points


    if category_lower == "shopping":
        add_bonus("Flipkart Coins", 0.01)

    elif category_lower == "food":
        add_bonus("Swiggy Rewards", 0.02)

    elif category_lower == "bills":
        add_bonus("Bills Cashback", 0.005)

    elif category_lower == "transport":
        add_bonus("Travel Rewards", 0.005)
    # 🔥 BONUS FOR HIGH AMOUNT (ANY CATEGORY)
    HIGH_AMOUNT_THRESHOLD = 1000  # you can change this

    if transaction.amount >= HIGH_AMOUNT_THRESHOLD:

        generic_program = f"{transaction.category} Rewards"

        reward = db.query(Reward).filter(
            Reward.user_id == current_user.id,
            Reward.program_name == generic_program
        ).first()

        if not reward:
            reward = Reward(
                program_name=generic_program,
                points_balance=0,
                user_id=current_user.id
            )
            db.add(reward)

        bonus_points = int(transaction.amount * 0.01)  # 1% bonus
        reward.points_balance += bonus_points

    db.commit()

    # 🔄 UPDATE BUDGET SPENT
    budget = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.category == transaction.category,
            Budget.month == transaction.transaction_date.month,
            Budget.year == transaction.transaction_date.year
        )
        .first()
    ) 


    if budget:
        budget.spent = calculate_spent(
            db,
            current_user.id,
            transaction.category,
            transaction.transaction_date.month,
            transaction.transaction_date.year
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

    # ✅ Real balance (already updated in create_transaction)
    total_balance = sum(a.balance for a in accounts)

    # Income = money received from outside
    income = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.to_account_id.in_(account_ids))
        .scalar()
    )

    # Expense = money sent outside
    expense = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(Transaction.from_account_id.in_(account_ids))
        .scalar()
    )

    return {
        "total_balance": float(total_balance),
        "total_income": float(income),
        "total_expenses": float(expense),
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
@router.get("/export/csv")
def export_transactions_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accounts = db.query(Account).filter(Account.owner_id == current_user.id).all()
    account_ids = [a.id for a in accounts]

    transactions = (
        db.query(Transaction)
        .filter(
            (Transaction.from_account_id.in_(account_ids)) |
            (Transaction.to_account_id.in_(account_ids))
        )
        .order_by(Transaction.transaction_date.desc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Date",
        "Description",
        "Category",
        "Amount",
        "Type"
    ])

    # Rows
    for tx in transactions:
        tx_type = "DEBIT" if tx.from_account_id in account_ids else "CREDIT"

        writer.writerow([
            tx.transaction_date,
            tx.description,
            tx.category,
            tx.amount,
            tx_type
        ])

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=transactions.csv"
        }
    )