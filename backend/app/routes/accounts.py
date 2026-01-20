from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from app.db.database import get_db
from app.models.account import Account
from app.schemas.account import AccountCreate, AccountOut
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/accounts", tags=["Accounts"])


@router.post("/", response_model=AccountOut, status_code=status.HTTP_201_CREATED)
def create_account(
    account: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_account = Account(
        user_id=current_user.id,
        bank_name=account.bank_name,
        account_type=account.account_type,
        masked_account=account.masked_account,
        currency=account.currency,
        balance=Decimal(str(account.balance))
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return new_account


@router.get("/", response_model=List[AccountOut])
def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    accounts = db.query(Account).filter(
        Account.user_id == current_user.id
    ).all()

    return accounts

@router.get("/{account_id}", response_model=AccountOut)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    return account

@router.put("/{account_id}")
def update_account(
    account_id: int,
    account: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()

    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")

    db_account.bank_name=account.bank_name
    db_account.account_type=account.account_type
    db_account.masked_account=account.masked_account
    db_account.currency=account.currency
    db_account.balance=Decimal(str(account.balance))

    db.commit()
    db.refresh(db_account)

    return db_account

@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()

    return None
