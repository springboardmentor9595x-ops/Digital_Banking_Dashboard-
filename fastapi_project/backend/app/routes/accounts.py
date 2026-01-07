from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.account import Account
from app.models.user import User
from app.schemas.account import AccountCreate, AccountResponse
from app.services.jwt_dependency import get_current_user

router = APIRouter(prefix="/accounts", tags=["Accounts"])

# CREATE ACCOUNT
@router.post("/", response_model=AccountResponse)
def create_account(
    account: AccountCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user = db.query(User).filter(User.email == current_user).first()

    new_account = Account(
        name=account.name,
        balance=account.balance,
        currency=account.currency,
        user_id=user.id
    )

    db.add(new_account)
    db.commit()
    db.refresh(new_account)

    return new_account


# GET ALL ACCOUNTS FOR LOGGED-IN USER
@router.get("/", response_model=list[AccountResponse])
def get_accounts(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user = db.query(User).filter(User.email == current_user).first()
    return db.query(Account).filter(Account.user_id == user.id).all()


# DELETE ACCOUNT
@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    user = db.query(User).filter(User.email == current_user).first()

    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()

    return {"message": "Account deleted successfully"}
