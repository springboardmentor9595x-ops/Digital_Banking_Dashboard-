from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionOut
# from app.schemas import account
# from app.schemas import transaction

router = APIRouter(tags=["Transactions"])

@router.post(
    "/transactions",
    response_model=TransactionOut,
    status_code=status.HTTP_201_CREATED
)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    #Account verificaton
    account = db.query(Account).filter(
        Account.id == transaction.account_id,
        Account.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found or does not belong to user"
        )

    #Enter new transaction
    new_txn = Transaction(
    account_id=transaction.account_id,
    description=transaction.description,
    category=transaction.category,
    amount=transaction.amount,
    currency=transaction.currency,
    txn_type=transaction.txn_type,
    merchant=transaction.merchant
    )

    db.add(new_txn)

    #Balance updation as per DEBIT/CREDIT
    current_balance = Decimal(str(account.balance))
    txn_amount = Decimal(str(transaction.amount))

    if transaction.txn_type == "debit":
        account.balance = current_balance - txn_amount
    elif transaction.txn_type == "credit":
        account.balance = current_balance + txn_amount
    else:
        raise HTTPException(status_code=400, detail="Invalid transaction type")

    db.commit()
    db.refresh(new_txn)

    return new_txn

@router.get(
    "/accounts/{account_id}/transactions",
    response_model=List[TransactionOut]
)
def get_transactions_for_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    ):
    #Account verification
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(
            status_code=404,
            detail="Account not found or does not belong to user"
        )

    #Fetch the transactions
    transactions = db.query(Transaction).filter(
        Transaction.account_id == account_id
    ).order_by(Transaction.txn_date.desc()).all()

    return transactions

