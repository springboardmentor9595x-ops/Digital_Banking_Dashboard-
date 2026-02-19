from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.account import Account
from app.models.transaction import Transaction
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/transfer",
    tags=["Transfer"]
)

@router.post("/")
def transfer_money(
    from_account_id: int,
    to_account_id: int,
    amount: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    from_acc = db.query(Account).filter(
        Account.id == from_account_id,
        Account.owner_id == current_user.id
    ).first()

    to_acc = db.query(Account).filter(
        Account.id == to_account_id
    ).first()

    if not from_acc or not to_acc:
        raise HTTPException(status_code=404, detail="Account not found")

    if from_acc.balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    # -----------------------
    # UPDATE BALANCES
    # -----------------------
    from_acc.balance -= amount
    to_acc.balance += amount

    now = datetime.utcnow()

    # -----------------------
    # SAVE TRANSFER (SENT)
    # -----------------------
    sent_txn = Transaction(
        from_account_id=from_acc.id,
        to_account_id=to_acc.id,
        amount=amount,
        currency="INR",
        status="SUCCESS",
        description="Transfer sent",
        merchant=None,
        category="Transfer",
        transaction_date=now,   # ✅ REQUIRED FIX
        created_at=now
    )

    # -----------------------
    # SAVE TRANSFER (RECEIVED)
    # -----------------------
    received_txn = Transaction(
        from_account_id=to_acc.id,
        to_account_id=from_acc.id,
        amount=amount,
        currency="INR",
        status="SUCCESS",
        description="Transfer received",
        merchant=None,
        category="Transfer",
        transaction_date=now,   # ✅ REQUIRED FIX
        created_at=now
    )

    db.add(sent_txn)
    db.add(received_txn)
    db.commit()

    return {"message": "Transfer successful"}
