from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import csv
import io
from datetime import datetime
from sqlalchemy import func

from auth.jwt_handler import get_current_user
from database import get_db
from model import Transaction, TransactionType, Account, User
from routes.transcations_schema import TransactionResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# ============================================
# 1. UPLOAD CSV TRANSACTIONS (IMPROVED)
# ============================================
@router.post("/upload-csv/{account_id}", status_code=status.HTTP_201_CREATED)
async def upload_transactions_csv(
    account_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload transactions from CSV file for a specific account"""

    # SECURITY CHECK: Verify the account belongs to the current user
    account_query = select(Account).where(
        Account.id == account_id, Account.user_id == current_user.id
    )
    account_result = await db.execute(account_query)
    account = account_result.scalars().first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or you don't have access",
        )

    # Read and parse CSV file
    try:
        contents = await file.read()
        decoded = contents.decode("utf-8")
        csv_reader = csv.DictReader(io.StringIO(decoded))

        # ✅ VALIDATE CSV HEADERS FIRST
        fieldnames = csv_reader.fieldnames
        required_columns = ["amount", "txn_type", "txn_date"]

        if not fieldnames:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV file is empty or has no headers",
            )

        missing_columns = [col for col in required_columns if col not in fieldnames]
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}. Required: amount, txn_type, txn_date",
            )

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File encoding error. Please use UTF-8 encoding.",
        )
    except HTTPException:
        raise  # Re-raise our custom exceptions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading CSV: {str(e)}",
        )

    transactions_created = 0
    errors = []

    # Process each row in the CSV
    for row_num, row in enumerate(csv_reader, start=2):
        try:
            # ✅ CHECK: txn_type exists
            if "txn_type" not in row or not row["txn_type"]:
                errors.append(f"Row {row_num}: Missing or empty 'txn_type'")
                continue

            # Validate transaction type
            txn_type_value = row["txn_type"].strip().lower()
            if txn_type_value not in ["debit", "credit"]:
                errors.append(
                    f"Row {row_num}: Invalid txn_type '{row['txn_type']}'. Must be 'debit' or 'credit'"
                )
                continue

            # ✅ CHECK: Required fields
            if not row.get("amount"):
                errors.append(f"Row {row_num}: Missing 'amount'")
                continue

            if not row.get("txn_date"):
                errors.append(f"Row {row_num}: Missing 'txn_date'")
                continue

            # Create transaction object
            transaction = Transaction(
                account_id=account_id,
                description=row.get("description", "").strip() or None,
                category=row.get("category", "").strip() or None,
                amount=float(row["amount"]),
                currency=row.get("currency", "INR").strip().upper(),
                txn_type=TransactionType(txn_type_value),
                merchant=row.get("merchant", "").strip() or None,
                txn_date=datetime.fromisoformat(row["txn_date"].strip()),
                posted_date=(
                    datetime.fromisoformat(row["posted_date"].strip())
                    if row.get("posted_date", "").strip()
                    else None
                ),
            )

            db.add(transaction)
            transactions_created += 1

        except KeyError as e:
            errors.append(f"Row {row_num}: Missing required column {str(e)}")
        except ValueError as e:
            errors.append(f"Row {row_num}: Invalid data - {str(e)}")
        except Exception as e:
            errors.append(f"Row {row_num}: Error - {str(e)}")

    # Only commit if we created transactions
    if transactions_created > 0:
        await db.commit()

    return {
        "message": f"Successfully imported {transactions_created} transactions",
        "account_id": account_id,
        "transactions_created": transactions_created,
        "errors": errors if errors else None,
    }


# ============================================
# 2. LIST ALL TRANSACTIONS (with optional filter by account)
# ============================================
@router.get("/", response_model=List[TransactionResponse])
async def list_transactions(
    account_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all transactions for the current user.

    - If account_id is provided: Returns transactions for that specific account
    - If account_id is NOT provided: Returns ALL transactions across all accounts
    """

    # Get all account IDs belonging to the user
    accounts_query = select(Account.id).where(Account.user_id == current_user.id)
    accounts_result = await db.execute(accounts_query)
    user_account_ids = [acc_id for acc_id, in accounts_result.fetchall()]

    if not user_account_ids:
        return []

    # Base query: All transactions from user's accounts
    query = select(Transaction).where(Transaction.account_id.in_(user_account_ids))

    # OPTIONAL FILTER: If account_id is provided, filter by that account
    if account_id is not None:
        # SECURITY: Verify this account belongs to the user
        if account_id not in user_account_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have access to this account",
            )
        query = query.where(Transaction.account_id == account_id)

    # Order by most recent first
    query = query.order_by(Transaction.txn_date.desc())

    result = await db.execute(query)
    transactions = result.scalars().all()

    return transactions


# ============================================
# 3. GET SINGLE TRANSACTION BY ID
# ============================================
@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single transaction by ID (with security check)"""

    # Find the transaction
    query = select(Transaction).where(Transaction.id == transaction_id)
    result = await db.execute(query)
    transaction = result.scalars().first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
        )

    # SECURITY CHECK: Verify the transaction's account belongs to the user
    account_query = select(Account).where(
        Account.id == transaction.account_id, Account.user_id == current_user.id
    )
    account_result = await db.execute(account_query)
    account = account_result.scalars().first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    return transaction


# ============================================
# 4. GET TRANSACTION SUMMARY FOR AN ACCOUNT
# ============================================
@router.get("/summary/{account_id}")
async def get_account_transactions_summary(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get transaction statistics for a specific account"""

    # SECURITY CHECK: Verify account belongs to user
    account_query = select(Account).where(
        Account.id == account_id, Account.user_id == current_user.id
    )
    account_result = await db.execute(account_query)
    account = account_result.scalars().first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
        )

    # Calculate total credits (income)
    credits_query = select(func.sum(Transaction.amount)).where(
        Transaction.account_id == account_id,
        Transaction.txn_type == TransactionType.credit,
    )
    credits_result = await db.execute(credits_query)
    total_credits = credits_result.scalar() or 0

    # Calculate total debits (expenses)
    debits_query = select(func.sum(Transaction.amount)).where(
        Transaction.account_id == account_id,
        Transaction.txn_type == TransactionType.debit,
    )
    debits_result = await db.execute(debits_query)
    total_debits = debits_result.scalar() or 0

    # Count total transactions
    count_query = select(func.count(Transaction.id)).where(
        Transaction.account_id == account_id
    )
    count_result = await db.execute(count_query)
    transaction_count = count_result.scalar()

    # Category breakdown (only debits/expenses)
    category_query = (
        select(Transaction.category, func.sum(Transaction.amount).label("total"))
        .where(
            Transaction.account_id == account_id,
            Transaction.txn_type == TransactionType.debit,
        )
        .group_by(Transaction.category)
    )

    category_result = await db.execute(category_query)
    category_breakdown = [
        {"category": cat or "Uncategorized", "total": float(total)}
        for cat, total in category_result.fetchall()
    ]

    return {
        "account_id": account_id,
        "transaction_count": transaction_count,
        "total_income": float(total_credits),
        "total_expenses": float(total_debits),
        "net_flow": float(total_credits - total_debits),
        "category_breakdown": category_breakdown,
    }
