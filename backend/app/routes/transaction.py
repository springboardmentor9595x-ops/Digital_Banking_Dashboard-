from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.post("/", response_model=TransactionResponse)
def create_transaction(
    txn: TransactionCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # 🔍 fetch accounts
    sender = db.query(Account).filter(Account.id == txn.from_account_id).first()
    receiver = db.query(Account).filter(Account.id == txn.to_account_id).first()

    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="Account not found")

    # 🔐 ownership check (THIS IS CORRECT)
    if sender.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to use this account",
        )

    # ✅ validations
    if txn.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    if sender.balance < txn.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    if sender.currency != receiver.currency:
        raise HTTPException(status_code=400, detail="Currency mismatch")

    # 💰 balance update
    sender.balance -= txn.amount
    receiver.balance += txn.amount

    transaction = Transaction(
        from_account_id=sender.id,
        to_account_id=receiver.id,
        amount=txn.amount,
        currency=sender.currency,
        status="SUCCESS",
    )

    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return transaction


@router.get("/", response_model=list[TransactionResponse])
def get_my_transactions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(Transaction)
        .join(Account, Transaction.from_account_id == Account.id)
        .filter(Account.owner_id == current_user.id)
        .all()
    )
