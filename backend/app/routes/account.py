from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.account import AccountCreate, AccountOut, AccountUpdate
from app.models.account import Account
from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter(prefix="/accounts", tags=["Accounts"])


# =========================
# CREATE ACCOUNT
# =========================
@router.post("/", response_model=AccountOut)
def create_account(
    account: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_account = Account(
        account_type=account.account_type,
        balance=account.balance,
        currency=account.currency,
        owner_id=current_user.id
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)
    return new_account


# =========================
# GET ALL ACCOUNTS
# =========================
@router.get("/", response_model=list[AccountOut])
def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accounts = db.query(Account).filter(
        Account.owner_id == current_user.id
    ).all()
    return accounts


# =========================
# UPDATE ACCOUNT
# =========================
@router.put("/{account_id}", response_model=AccountOut)
def update_account(
    account_id: int,
    data: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.owner_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if data.account_type is not None:
        account.account_type = data.account_type
    if data.currency is not None:
        account.currency = data.currency

    db.commit()
    db.refresh(account)
    return account


# =========================
# DELETE ACCOUNT
# =========================
@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.owner_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()
    return {"message": "Account deleted successfully"}
