from typing import List, Optional
from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException,
    status,
    Response,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import csv
import io
from datetime import datetime
from sqlalchemy import func
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from auth.jwt_handler import get_current_user
from database import get_db
from model import Transaction, TransactionType, Account, User
from routes.transcations_schema import (
    TransactionResponse,
    TransactionCreate,
    TransactionUpdate,
)
from services.categorization import auto_categorize  # ✅ Single import
import csv
import io
from fastapi import Response
from fastapi.responses import StreamingResponse

router = APIRouter(prefix="/transactions", tags=["Transactions"])


# ============================================
# HELPER FUNCTION: Recalculate Account Balance
# ============================================
async def recalculate_account_balance(db: AsyncSession, account_id: int):
    """
    Recalculate account balance based on all transactions.
    Balance = Credits - Debits
    """
    print(f"🔄 Recalculating balance for account_id: {account_id}")  # ✅ DEBUG

    # Get all credits for this account
    credits_query = select(func.sum(Transaction.amount)).where(
        Transaction.account_id == account_id,
        Transaction.txn_type == TransactionType.credit,
    )
    credits_result = await db.execute(credits_query)
    total_credits = credits_result.scalar() or 0
    print(f"   Total Credits: {total_credits}")  # ✅ DEBUG

    # Get all debits for this account
    debits_query = select(func.sum(Transaction.amount)).where(
        Transaction.account_id == account_id,
        Transaction.txn_type == TransactionType.debit,
    )
    debits_result = await db.execute(debits_query)
    total_debits = debits_result.scalar() or 0
    print(f"   Total Debits: {total_debits}")  # ✅ DEBUG

    # Calculate new balance
    new_balance = float(total_credits) - float(total_debits)
    print(f"   New Balance: {new_balance}")  # ✅ DEBUG

    # Update account
    account_query = select(Account).where(Account.id == account_id)
    account_result = await db.execute(account_query)
    account = account_result.scalars().first()

    if account:
        old_balance = account.balance
        account.balance = new_balance
        await db.commit()
        print(f"✅ Balance updated! {old_balance} → {new_balance}")  # ✅ DEBUG
    else:
        print(f"❌ Account {account_id} not found!")  # ✅ DEBUG

    return new_balance


# ============================================
# 1. CREATE SINGLE TRANSACTION (MANUAL ENTRY)
# ============================================
@router.post(
    "/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED
)
async def create_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a single transaction manually with auto-categorization"""

    # Security Check - Verify Account Ownership
    account_query = select(Account).where(
        Account.id == payload.account_id, Account.user_id == current_user.id
    )
    account_result = await db.execute(account_query)
    account = account_result.scalars().first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or you don't have permission to add transactions to it",
        )

    # Validate and Convert txn_type
    try:
        txn_type_enum = TransactionType(payload.txn_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid txn_type. Must be 'debit' or 'credit'",
        )

    # ✅ Auto-categorize if category not provided
    if payload.category and payload.category.strip():
        final_category = payload.category.strip()
    else:
        final_category = await auto_categorize(  # ✅ No "from" here
            db=db,
            merchant=payload.merchant,
            description=payload.description,
            user_id=current_user.id,
        )

    new_transaction = Transaction(
        account_id=payload.account_id,
        description=payload.description,
        category=final_category,  # ✅ Auto-categorized
        amount=payload.amount,
        currency=payload.currency,
        txn_type=txn_type_enum,
        merchant=payload.merchant,
        txn_date=payload.txn_date,
        posted_date=datetime.now(),
    )

    db.add(new_transaction)
    await db.commit()
    await db.refresh(new_transaction)

    # ✅ ADD THIS DEBUG LINE
    print(f"🔥 ABOUT TO UPDATE BALANCE FOR ACCOUNT {payload.account_id}")

    await recalculate_account_balance(db, payload.account_id)

    print(f"✅ BALANCE UPDATE COMPLETE")

    return new_transaction


# ============================================
# 2. UPLOAD CSV TRANSACTIONS
# ============================================
@router.post("/upload-csv/{account_id}", status_code=status.HTTP_201_CREATED)
async def upload_transactions_csv(
    account_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload transactions from CSV file with auto-categorization"""

    # SECURITY CHECK
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

        # Validate CSV headers
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
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading CSV: {str(e)}",
        )

    transactions_created = 0
    errors = []

    # Process each row
    for row_num, row in enumerate(csv_reader, start=2):
        try:
            # Validate txn_type
            if "txn_type" not in row or not row["txn_type"]:
                errors.append(f"Row {row_num}: Missing or empty 'txn_type'")
                continue

            txn_type_value = row["txn_type"].strip().lower()
            if txn_type_value not in ["debit", "credit"]:
                errors.append(
                    f"Row {row_num}: Invalid txn_type '{row['txn_type']}'. Must be 'debit' or 'credit'"
                )
                continue

            # Validate required fields
            if not row.get("amount"):
                errors.append(f"Row {row_num}: Missing 'amount'")
                continue

            if not row.get("txn_date"):
                errors.append(f"Row {row_num}: Missing 'txn_date'")
                continue

            # Extract merchant and description
            merchant = row.get("merchant", "").strip() or None
            description = row.get("description", "").strip() or None

            # Auto-categorize if category not in CSV
            csv_category = row.get("category", "").strip() or None
            if csv_category:
                final_category = csv_category
            else:
                final_category = await auto_categorize(
                    db=db,
                    merchant=merchant,
                    description=description,
                    user_id=current_user.id,
                )

            transaction = Transaction(
                account_id=account_id,
                description=description,
                category=final_category,
                amount=float(row["amount"]),
                currency=row.get("currency", "INR").strip().upper(),
                txn_type=TransactionType(txn_type_value),
                merchant=merchant,
                txn_date=datetime.fromisoformat(row["txn_date"].strip()),
                posted_date=datetime.now(),
            )

            db.add(transaction)
            transactions_created += 1

        except KeyError as e:
            errors.append(f"Row {row_num}: Missing required column {str(e)}")
        except ValueError as e:
            errors.append(f"Row {row_num}: Invalid data - {str(e)}")
        except Exception as e:
            errors.append(f"Row {row_num}: Error - {str(e)}")

    # Commit only if transactions were created
    if transactions_created > 0:
        await db.commit()
        await recalculate_account_balance(db, account_id)  # ✅ THE ONE MISSING LINE

    return {
        "message": f"Successfully imported {transactions_created} transactions",
        "account_id": account_id,
        "transactions_created": transactions_created,
        "errors": errors if errors else None,
    }


# ============================================
# 3. LIST ALL TRANSACTIONS
# ============================================
@router.get("/", response_model=List[TransactionResponse])
async def list_transactions(
    account_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all transactions for the current user"""

    # Get all account IDs belonging to the user
    accounts_query = select(Account.id).where(Account.user_id == current_user.id)
    accounts_result = await db.execute(accounts_query)
    user_account_ids = [acc_id for acc_id, in accounts_result.fetchall()]

    if not user_account_ids:
        return []

    # Base query
    query = select(Transaction).where(Transaction.account_id.in_(user_account_ids))

    # Optional filter by account_id
    if account_id is not None:
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
# 4. GET TRANSACTION SUMMARY
# ============================================
@router.get("/summary/{account_id}")
async def get_account_transactions_summary(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get transaction statistics for a specific account"""

    # Security check
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


# ============================================
# 5. UPDATE TRANSACTION
# ============================================
@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    payload: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing transaction"""

    # Get user's account IDs
    accounts_query = select(Account.id).where(Account.user_id == current_user.id)
    accounts_result = await db.execute(accounts_query)
    account_ids = [row[0] for row in accounts_result.all()]

    if not account_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No accounts found"
        )

    # Find transaction and verify ownership
    query = select(Transaction).where(
        Transaction.id == transaction_id, Transaction.account_id.in_(account_ids)
    )
    result = await db.execute(query)
    transaction = result.scalars().first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found or you don't have permission to edit it",
        )

    # Apply partial updates
    if payload.description is not None:
        transaction.description = payload.description

    if payload.category is not None:
        transaction.category = payload.category

    if payload.amount is not None:
        transaction.amount = payload.amount

    if payload.currency is not None:
        transaction.currency = payload.currency

    if payload.txn_type is not None:
        try:
            transaction.txn_type = TransactionType(payload.txn_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid txn_type. Must be 'debit' or 'credit'",
            )

    if payload.merchant is not None:
        transaction.merchant = payload.merchant

    if payload.txn_date is not None:
        transaction.txn_date = payload.txn_date

    await db.commit()
    await db.refresh(transaction)

    return transaction


# ============================================
# 6. GET SINGLE TRANSACTION BY ID
# ============================================
@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single transaction by ID"""

    # Find transaction
    query = select(Transaction).where(Transaction.id == transaction_id)
    result = await db.execute(query)
    transaction = result.scalars().first()

    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found"
        )

    # Security check
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
# 7. TEST ENDPOINT - Categorization Preview
# ============================================
@router.post("/categorize-preview")
async def preview_categorization(
    merchant: Optional[str] = None,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Test endpoint to preview categorization.

    Example:
        POST /transactions/categorize-preview
        Body: {"merchant": "Starbucks"}
        Response: {"predicted_category": "Food & Dining"}
    """

    if not merchant and not description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least merchant or description",
        )

    category = await auto_categorize(
        db=db, merchant=merchant, description=description, user_id=current_user.id
    )

    return {
        "merchant": merchant,
        "description": description,
        "predicted_category": category,
    }


@router.get("/export/{account_id}/csv")
async def export_transactions_csv(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export all transactions for a specific account as CSV.
    Access control: only owner of the account.
    """
    # Verify account belongs to user
    account_q = select(Account).where(
        Account.id == account_id, Account.user_id == current_user.id
    )
    account_res = await db.execute(account_q)
    account = account_res.scalars().first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or you don't have access",
        )

    txn_q = (
        select(Transaction)
        .where(Transaction.account_id == account_id)
        .order_by(Transaction.txn_date.desc())
    )
    txn_res = await db.execute(txn_q)
    txns = txn_res.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "id",
            "account_id",
            "description",
            "category",
            "merchant",
            "amount",
            "currency",
            "txn_type",
            "txn_date",
            "posted_date",
        ]
    )

    for t in txns:
        writer.writerow(
            [
                t.id,
                t.account_id,
                t.description or "",
                t.category or "",
                t.merchant or "",
                float(t.amount),
                t.currency,
                (
                    t.txn_type.value
                    if isinstance(t.txn_type, TransactionType)
                    else t.txn_type
                ),
                t.txn_date.isoformat(),
                t.posted_date.isoformat() if t.posted_date else "",
            ]
        )

    filename = f"transactions_account_{account_id}_{datetime.now().date()}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/{account_id}/pdf")
async def export_transactions_pdf(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Export all transactions for a specific account as a formatted PDF table"""

    # Verify account belongs to user
    account_q = select(Account).where(
        Account.id == account_id, Account.user_id == current_user.id
    )
    account_res = await db.execute(account_q)
    account = account_res.scalars().first()

    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found or you don't have access",
        )

    # Get all transactions
    txn_q = (
        select(Transaction)
        .where(Transaction.account_id == account_id)
        .order_by(Transaction.txn_date.desc())
    )
    txn_res = await db.execute(txn_q)
    txns = txn_res.scalars().all()

    # Create PDF with proper table formatting
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Title Section
    y = height - 50
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, y, f"Transactions Report - {account.bank_name}")

    y -= 20
    c.setFont("Helvetica", 10)
    c.drawString(50, y, f"Account: {account.masked_account or 'N/A'}")

    y -= 15
    c.drawString(50, y, f"Generated: {datetime.now().strftime('%d %b %Y, %I:%M %p')}")

    y -= 30

    # Table Header
    c.setFont("Helvetica-Bold", 9)
    c.drawString(50, y, "Date")
    c.drawString(120, y, "Type")
    c.drawString(180, y, "Amount")
    c.drawString(260, y, "Category")
    c.drawString(360, y, "Description")

    # Draw header line
    y -= 5
    c.line(50, y, width - 50, y)
    y -= 15

    # Table Rows
    c.setFont("Helvetica", 8)

    for t in txns:
        # Check if we need a new page
        if y < 60:
            c.showPage()
            y = height - 50
            c.setFont("Helvetica", 8)

        # Format data
        date_str = t.txn_date.strftime("%Y-%m-%d")
        type_str = t.txn_type.value.upper()
        amount_str = f"₹{float(t.amount):,.2f}"
        category_str = (t.category or "Uncategorized")[:18]
        description_str = (t.description or "")[:30]

        # Draw row
        c.drawString(50, y, date_str)
        c.drawString(120, y, type_str)

        # Color amount based on type
        if t.txn_type == TransactionType.debit:
            c.setFillColorRGB(0.8, 0.2, 0.2)  # Red for debit
        else:
            c.setFillColorRGB(0.2, 0.6, 0.2)  # Green for credit

        c.drawString(180, y, amount_str)
        c.setFillColorRGB(0, 0, 0)  # Reset to black

        c.drawString(260, y, category_str)
        c.drawString(360, y, description_str)

        y -= 14

    # Footer with summary
    c.line(50, y, width - 50, y)
    y -= 20

    total_credits = sum(
        float(t.amount) for t in txns if t.txn_type == TransactionType.credit
    )
    total_debits = sum(
        float(t.amount) for t in txns if t.txn_type == TransactionType.debit
    )

    c.setFont("Helvetica-Bold", 9)
    c.drawString(50, y, f"Total Credits: ₹{total_credits:,.2f}")
    y -= 15
    c.drawString(50, y, f"Total Debits: ₹{total_debits:,.2f}")
    y -= 15
    c.drawString(50, y, f"Net: ₹{(total_credits - total_debits):,.2f}")

    c.showPage()
    c.save()
    buffer.seek(0)

    filename = f"transactions_{account.bank_name}_{datetime.now().date()}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
