from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import csv
import io
from datetime import datetime

from ..auth.jwt_handler import get_current_user
from ..database import get_db
from ..model import Transaction, TransactionType, Account, User
from ..routes.transcations_schema import (
    TransactionResponse,
    TransactionCreate,
)

router = APIRouter(prefix="/transactions", tags=["Transactions"])

# =====================================================
# 1. CREATE TRANSACTION
# =====================================================
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # SECURITY: verify account belongs to user
    account_query = select(Account).where(
        Account.id == transaction.account_id,
        Account.user_id == current_user.id,
    )
    result = await db.execute(account_query)
    account = result.scalars().first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not found or access denied",
        )

    new_transaction = Transaction(
        account_id=transaction.account_id,
        description=transaction.description,
        category=transaction.category,
        amount=transaction.amount,
        currency=transaction.currency,
        txn_type=TransactionType(transaction.txn_type),
        merchant=transaction.merchant,
        txn_date=transaction.txn_date,
        posted_date=transaction.posted_date,
    )

    db.add(new_transaction)
    await db.commit()
    await db.refresh(new_transaction)

    return {
        "message": "Transaction created successfully",
        "transaction_id": new_transaction.id,
    }

# =====================================================
# 2. UPLOAD CSV TRANSACTIONS
# =====================================================
@router.post("/upload-csv/{account_id}", status_code=status.HTTP_201_CREATED)
async def upload_transactions_csv(
    account_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account_query = select(Account).where(
        Account.id == account_id, Account.user_id == current_user.id
    )
    result = await db.execute(account_query)
    account = result.scalars().first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or access denied",
        )

    try:
        contents = await file.read()
        decoded = contents.decode("utf-8")
        csv_reader = csv.DictReader(io.StringIO(decoded))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV file")

    transactions_created = 0

    for row in csv_reader:
        try:
            txn_type = TransactionType(row["txn_type"].lower())
        except ValueError:
            continue  # Skip invalid txn_type rows

        txn = Transaction(
            account_id=account_id,
            description=row.get("description"),
            category=row.get("category"),
            amount=float(row["amount"]),
            currency=row.get("currency", "INR"),
            txn_type=txn_type,
            merchant=row.get("merchant"),
            txn_date=datetime.fromisoformat(row["txn_date"]),
            posted_date=(
                datetime.fromisoformat(row["posted_date"])
                if row.get("posted_date")
                else None
            ),
        )
        db.add(txn)
        transactions_created += 1


    if transactions_created > 0:
        await db.commit()

    return {
        "message": f"Successfully imported {transactions_created} transactions",
        "account_id": account_id,
    }

# =====================================================
# 3. LIST TRANSACTIONS
# =====================================================
@router.get("/", response_model=List[TransactionResponse])
async def list_transactions(
    account_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    accounts_query = select(Account.id).where(Account.user_id == current_user.id)
    result = await db.execute(accounts_query)
    account_ids = [row[0] for row in result.fetchall()]

    if not account_ids:
        return []

    query = select(Transaction).where(Transaction.account_id.in_(account_ids))

    if account_id is not None:
        if account_id not in account_ids:
            raise HTTPException(status_code=403, detail="Access denied")
        query = query.where(Transaction.account_id == account_id)

    query = query.order_by(Transaction.txn_date.desc())
    result = await db.execute(query)
    return result.scalars().all()

# =====================================================
# 4. GET SINGLE TRANSACTION
# =====================================================
@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Transaction).where(Transaction.id == transaction_id)
    result = await db.execute(query)
    transaction = result.scalars().first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    account_query = select(Account).where(
        Account.id == transaction.account_id,
        Account.user_id == current_user.id,
    )
    result = await db.execute(account_query)

    if not result.scalars().first():
        raise HTTPException(status_code=403, detail="Access denied")

    return transaction

# =====================================================
# 5. TRANSACTION SUMMARY
# =====================================================
@router.get("/summary/{account_id}")
async def transaction_summary(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # SECURITY: verify account belongs to user
    account_query = select(Account).where(
        Account.id == account_id,
        Account.user_id == current_user.id,
    )
    result = await db.execute(account_query)
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Account not found")

    # ---- INCOME ----
    income_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.account_id == account_id,
            Transaction.txn_type == TransactionType.credit,
        )
    )
    total_income = float(income_result.scalar() or 0)

    # ---- EXPENSES ----
    expenses_result = await db.execute(
        select(func.sum(Transaction.amount)).where(
            Transaction.account_id == account_id,
            Transaction.txn_type == TransactionType.debit,
        )
    )
    total_expenses = float(expenses_result.scalar() or 0)

    # ---- RESPONSE ----
    return {
        "account_id": account_id,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_flow": total_income - total_expenses,
    }
