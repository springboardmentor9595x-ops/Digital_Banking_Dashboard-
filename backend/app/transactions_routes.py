from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator
from typing import Optional, List
from .database import get_db
from .models import Transaction, Account
from .deps import get_current_user
from datetime import datetime
from decimal import Decimal
from sqlalchemy import func
import csv
from io import StringIO

router = APIRouter(prefix="/transactions", tags=["Transactions"])

VALID_TYPES = ["income", "expense"]

class TransactionCreate(BaseModel):
    account_id: int
    type: str = Field(..., description="income / expense")
    amount: float
    category: Optional[str] = None
    description: Optional[str] = None
    date: datetime
  
    @validator("type")
    def validate_type(cls, value):
        if value not in VALID_TYPES:
            raise ValueError("Type must be income or expense")
        return value

    @validator("amount")
    def validate_amount(cls, value):
        if value <= 0:
            raise ValueError("Amount must be greater than zero")
        return value

    @validator("category")
    def clean_category(cls, value):
        if value:
            return value.strip()
        return value

class TransactionResponse(BaseModel):
    id: int
    account_id: int
    type: str
    amount: float
    category: Optional[str]
    description: Optional[str]
    date: datetime


    class Config:
        orm_mode = True


# ---------------- ROUTES ----------------


# Create transaction
@router.post("/", response_model=TransactionResponse)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.id == data.account_id,
        Account.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    # ----------- BALANCE LOGIC -----------
    amount = Decimal(str(data.amount))

    if data.type == "income":
        account.balance = account.balance + amount

    elif data.type == "expense":
        if account.balance < amount:
            raise HTTPException(
                status_code=400,
                detail="Insufficient balance for this expense"
        )
        account.balance = account.balance - amount


    # ----------- SAVE TRANSACTION -----------

    trx = Transaction(
        user_id=current_user.id,
        account_id=data.account_id,
        type=data.type,
        amount=data.amount,
        category=data.category,
        description=data.description,
        date=data.date
    )

    db.add(trx)
    db.commit()
    db.refresh(trx)

    return trx




# List all transactions of logged-in user
@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).all()


@router.get("/account/{account_id}", response_model=list[TransactionResponse])
def get_transactions_by_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Transaction).filter(
        Transaction.account_id == account_id,
        Transaction.user_id == current_user.id
    ).all()


@router.get("/filter", response_model=list[TransactionResponse])
def filter_transactions(
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    )

    if from_date:
        query = query.filter(Transaction.date >= from_date)

    if to_date:
        query = query.filter(Transaction.date <= to_date)

    return query.all()


@router.get("/summary")
def transaction_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "income"
    ).scalar() or 0

    expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense"
    ).scalar() or 0

    return {
        "total_income": float(income),
        "total_expense": float(expense),
        "balance_difference": float(income - expense)
    }


@router.post("/upload_csv/{account_id}")
def upload_csv(
    account_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # ensure CSV
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be CSV")

    # ensure account belongs to user
    account = db.query(Account).filter(
        Account.id == account_id,
        Account.user_id == current_user.id
    ).first()

    if not account:
        raise HTTPException(status_code=403, detail="Account not found or unauthorized")

    # read CSV file content
    content = file.file.read().decode("utf-8")
    reader = csv.DictReader(StringIO(content))

    added = 0

    for row in reader:
        try:
            csv_type = row["type"].lower().strip()

        # map banking terms to app terms
            if csv_type == "credit":
                tx_type = "income"
            elif csv_type == "debit":
                tx_type = "expense"
            else:
                continue

            amount = abs(Decimal(row["amount"]))

            
            transaction = Transaction(
            user_id=current_user.id,
            account_id=account_id,
            type=tx_type,
            amount = amount,
            category="CSV Import",
            description=row.get("description", ""),
           date=datetime.strptime(row["date"], "%Y-%m-%d")

        )

            db.add(transaction)
            db.flush() 

        # update account balance correctly
            if tx_type == "expense":
                account.balance -= amount 
            else:
                account.balance += amount 
            added += 1

        except Exception as e:
            print("CSV ERROR:", row, e)
            continue



    db.commit()

    return {"message": "CSV imported", "rows_added": added}

@router.get("/csv")
def get_csv_transactions(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.category == "CSV Import"
    ).all()
