from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import csv
import io
from datetime import datetime, timezone # for handling dates
from decimal import Decimal, InvalidOperation # for precise money handling

from ..auth.jwt_handler import get_current_user
from ..database import get_db
from ..model import Transaction, TransactionType, Account, User
from ..routes.transcations_schema import (TransactionResponse, TransactionCreate, )
from ..services.categorizer import auto_assign_category
router = APIRouter(prefix="/transactions", tags=["Transactions"])


## Helper function to parse various date formats
def parse_date(date_str: str) -> datetime:
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y"):
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"Invalid date format: {date_str}")

# =====================================================
# 1. CREATE TRANSACTION
# =====================================================
@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db),
):
    # 1. Verify account belongs to user
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
    category = transaction.category
    if not category:
        category = auto_assign_category(
            f"{transaction.merchant} {transaction.description or ''}"
        )
    duplicate_query = select(Transaction).where(
        Transaction.account_id == transaction.account_id,
        Transaction.amount == transaction.amount,
        Transaction.txn_type == TransactionType(transaction.txn_type),
        Transaction.merchant == transaction.merchant,
        Transaction.txn_date == transaction.txn_date,
    )

    existing = await db.execute(duplicate_query)
    if existing.scalars().first():
        raise HTTPException(
            status_code=409,
            detail="Duplicate transaction detected",
        )

    # 2. Create transaction
    new_transaction = Transaction(
        account_id=transaction.account_id,
        description=transaction.description,
        category=category,
        amount=transaction.amount,
        currency=transaction.currency,
        txn_type=TransactionType(transaction.txn_type),
        merchant=transaction.merchant,
        txn_date=transaction.txn_date,
        posted_date=datetime.now(timezone.utc),
    )
    db.add(new_transaction)

    # 3. Update account balance
    amount = Decimal(str(new_transaction.amount))
    if new_transaction.txn_type == TransactionType.credit:
        account.balance += amount
    else:
        account.balance -= amount

    # 4. Commit once
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
        required_columns = {
        "amount", "txn_type", "merchant", "txn_date"
        }
        if not required_columns.issubset(csv_reader.fieldnames):
            raise HTTPException(
                status_code=400,
                detail=f"CSV must contain columns: {required_columns}"
            )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid CSV file")

    transactions_created = 0
    rows_skipped = 0

    for row in csv_reader:
        try:
            print("CSV ROW:", row)  
            merchant = row.get("merchant")
            if not merchant or not merchant.strip():
                rows_skipped += 1
                continue

            txn_type = TransactionType(row["txn_type"].lower())
            amount = Decimal(str(row["amount"]))
            txn_date = parse_date(row["txn_date"])


            category = (row.get("category") or "").strip()
            if not category:

                category = auto_assign_category(
                    f"{merchant} {row.get('description', '')}"
                )
            duplicate_query = select(Transaction).where(
                Transaction.account_id == account_id,
                Transaction.amount == amount,
                Transaction.txn_type == txn_type,
                Transaction.merchant == merchant,
                Transaction.txn_date == txn_date,
            )

            existing = await db.execute(duplicate_query)
            if existing.scalars().first():
                rows_skipped += 1
                continue

            txn = Transaction(
                account_id=account_id,
                description=row.get("description"),
                category=category,
                amount=amount,
                currency=row.get("currency", "INR"),
                txn_type=txn_type,
                merchant=merchant,
                txn_date=txn_date,
                posted_date=datetime.now(timezone.utc),
            )

            db.add(txn)

            if txn_type == TransactionType.credit:
                account.balance += amount
            else:
                account.balance -= amount

            transactions_created += 1

        except Exception as e:
            print("CSV SKIPPED ROW:", row, "ERROR:", e)
            rows_skipped += 1
            continue

    if transactions_created == 0:
        raise HTTPException(
            status_code=400,
            detail="No valid transactions found. Check CSV format or dates."
        )

    await db.commit()

    return {
        "message": f"Imported {transactions_created} transactions, skipped {rows_skipped} duplicates/invalid rows",
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

# =====================================================
# 6. UPDATE TRANSACTION CATEGORY
# =====================================================
@router.put("/{transaction_id}", status_code=200)
async def update_transaction_category(
    transaction_id: int,
    payload: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Transaction).where(Transaction.id == transaction_id)
    result = await db.execute(query)
    txn = result.scalars().first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # verify ownership
    account_query = select(Account).where(
        Account.id == txn.account_id,
        Account.user_id == current_user.id,
    )
    acc_result = await db.execute(account_query)
    if not acc_result.scalars().first():
        raise HTTPException(status_code=403, detail="Access denied")

    txn.category = payload.get("category", txn.category)

    await db.commit()
    return {"message": "Category updated"}

# ==========================================
# Delete Transaction
# ==========================================
@router.delete("/{transaction_id}", status_code=200)
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction).where(Transaction.id == transaction_id)
    )
    txn = result.scalars().first()

    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Verify ownership
    acc_result = await db.execute(
        select(Account).where(
            Account.id == txn.account_id,
            Account.user_id == current_user.id,
        )
    )
    account = acc_result.scalars().first()

    if not account:
        raise HTTPException(status_code=403, detail="Access denied")

    # Reverse balance impact
    amount = Decimal(str(txn.amount))

    if txn.txn_type == TransactionType.credit:
        account.balance -= amount
    else:
        account.balance += amount


    await db.delete(txn)
    await db.commit()

    return {"message": "Transaction deleted"}
