# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from pydantic import BaseModel, Field, validator
# from typing import Optional
# from .database import get_db
# from .models import Account
# from .deps import get_current_user

# router = APIRouter(prefix="/accounts", tags=["Accounts"])

# VALID_TYPES = ["savings", "checking", "credit_card", "loan", "investment"]

# class AccountCreate(BaseModel):
#     bank_name: str
#     account_type: str = Field(..., description="savings/checking/credit_card/loan/investment")
#     masked_account: str
#     currency: str
#     balance: float

#     @validator("account_type")
#     def validate_type(cls, value):
#         if value not in VALID_TYPES:
#             raise ValueError("Invalid account type")
#         return value

#     @validator("currency")
#     def validate_currency(cls, value):
#         if len(value) != 3:
#             raise ValueError("Currency must be 3 letters like INR or USD")
#         return value.upper()

#     @validator("balance")
#     def validate_balance(cls, value):
#         if value < 0:
#             raise ValueError("Balance cannot be negative")
#         return value

#     @validator("masked_account")
#     def validate_masked(cls, value):
#         if not value.startswith("****") or len(value) < 6:
#             raise ValueError("Masked account must look like ****1234")
#         return value

# class AccountUpdate(BaseModel):
#     bank_name: Optional[str]
#     account_type: Optional[str]
#     masked_account: Optional[str]
#     currency: Optional[str]
#     balance: Optional[float]
# @router.post("/")
# def create_account(
#     data: AccountCreate,
#     db: Session = Depends(get_db),
#     current_user = Depends(get_current_user)
# ):
#     account = Account(
#         user_id=current_user.id,
#         bank_name=data.bank_name,
#         account_type=data.account_type,
#         masked_account=data.masked_account,
#         currency=data.currency,
#         balance=data.balance
#     )

#     db.add(account)
#     db.commit()
#     db.refresh(account)

#     return {"message": "Account created successfully"}


# @router.get("/")
# def get_accounts(db: Session = Depends(get_db),
#                  user_id: int = Depends(get_current_user)):

#     return db.query(Account).filter(Account.user_id == user_id).all()

# @router.put("/{account_id}")
# def update_account(account_id: int,
#                    data: AccountUpdate,
#                    db: Session = Depends(get_db),
#                    user_id: int = Depends(get_current_user)):

#     account = db.query(Account).filter(Account.id == account_id,
#                                        Account.user_id == user_id).first()

#     if not account:
#         raise HTTPException(status_code=404, detail="Account not found")

#     for k, v in data.dict(exclude_unset=True).items():
#         setattr(account, k, v)

#     db.commit()
#     return {"message": "Account updated"}
# @router.delete("/{account_id}")
# def delete_account(account_id: int,
#                    db: Session = Depends(get_db),
#                    user_id: int = Depends(get_current_user)):

#     account = db.query(Account).filter(Account.id == account_id,
#                                        Account.user_id == user_id).first()

#     if not account:
#         raise HTTPException(status_code=404, detail="Account not found")

#     db.delete(account)
#     db.commit()

#     return {"message": "Account deleted"}


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator
from typing import Optional
from .database import get_db
from .models import Account
from .deps import get_current_user
from decimal import Decimal, ROUND_HALF_UP



router = APIRouter(prefix="/accounts", tags=["Accounts"])

VALID_TYPES = ["savings", "checking", "credit_card", "loan", "investment"]

def normalize_amount(value: float):
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

# ---------- SCHEMAS ----------

class AccountCreate(BaseModel):
    bank_name: str
    account_type: str = Field(..., description="savings/checking/credit_card/loan/investment")
    masked_account: str
    currency: str
    balance: float

    @validator("account_type")
    def validate_type(cls, value):
        if value not in VALID_TYPES:
            raise ValueError("Invalid account type")
        return value

    @validator("currency")
    def validate_currency(cls, value):
        if len(value) != 3:
            raise ValueError("Currency must be 3 letters like INR or USD")
        return value.upper()

    @validator("balance")
    def validate_balance(cls, value):
        if value < 0:
            raise ValueError("Balance cannot be negative")
        return value

    @validator("masked_account")
    def validate_masked(cls, value):
        if not value.startswith("****") or len(value) < 6:
            raise ValueError("Masked account must look like ****1234")
        return value


class AccountUpdate(BaseModel):
    bank_name: Optional[str]
    account_type: Optional[str]
    masked_account: Optional[str]
    currency: Optional[str]
    balance: Optional[float]

    @validator("balance")
    def no_negative_update(cls, value):
        if value is not None and value < 0:
            raise ValueError("Balance cannot be negative")
        return value



# ---------- ROUTES ----------

@router.post("/")
def create_account(
    data: AccountCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    account = Account(
        user_id=current_user.id,
        bank_name=data.bank_name,
        account_type=data.account_type,
        masked_account=data.masked_account,
        currency=data.currency,
        balance=normalize_amount(data.balance)

    )

    db.add(account)
    db.commit()
    db.refresh(account)

    return {"message": "Account created successfully"}


@router.get("/")
def get_accounts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Account).filter(Account.user_id == current_user.id).all()


@router.put("/{account_id}")
def update_account(
    account_id: int,
    data: AccountUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this account"
        )

    for k, v in data.dict(exclude_unset=True).items():
        if k == "balance" and v is not None:
            v = normalize_amount(v)
        setattr(account, k, v)


    db.commit()
    return {"message": "Account updated"}


@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this account"
        )

    db.delete(account)
    db.commit()

    return {"message": "Account deleted"}
