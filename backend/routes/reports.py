# backend/routes/reports.py
from fastapi import APIRouter, Depends, Response, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, extract, func
from datetime import datetime
import io
import csv

from auth.jwt_handler import get_current_user
from database import get_db
from model import User, Transaction, Account, Budget, TransactionType

router = APIRouter(prefix="/reports", tags=["Reports"])


async def _get_user_account_ids(db: AsyncSession, user_id: int):
    q = select(Account.id).where(Account.userid == user_id)
    rows = (await db.execute(q)).fetchall()
    return [row[0] for row in rows]


@router.get("/transactions/csv")
async def export_transactions_csv(
    month: int = Query(None, ge=1, le=12),
    year: int = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export user's transactions as CSV.
    Optional filters: month, year (txn_date).
    """
    account_ids = await _get_user_account_ids(db, current_user.id)
    if not account_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No accounts / transactions found",
        )

    q = select(
        Transaction.id,
        Transaction.accountid,
        Transaction.description,
        Transaction.category,
        Transaction.merchant,
        Transaction.amount,
        Transaction.currency,
        Transaction.txntype,
        Transaction.txndate,
    ).where(Transaction.accountid.in_(account_ids))

    if month and year:
        q = q.where(
            extract("month", Transaction.txndate) == month,
            extract("year", Transaction.txndate) == year,
        )

    result = await db.execute(q)
    rows = result.fetchall()

    # Build CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "Transaction ID",
            "Account ID",
            "Description",
            "Category",
            "Merchant",
            "Amount",
            "Currency",
            "Type",
            "Date",
        ]
    )

    for r in rows:
        writer.writerow(
            [
                r.id,
                r.accountid,
                r.description or "",
                r.category or "",
                r.merchant or "",
                float(r.amount),
                r.currency,
                (
                    r.txntype.value
                    if isinstance(r.txntype, TransactionType)
                    else r.txntype
                ),
                (
                    r.txntdate.isoformat()
                    if isinstance(r.txntdate, datetime)
                    else r.txntdate
                ),
            ]
        )

    csv_data = output.getvalue()
    output.close()

    filename = f"transactions_{year or 'all'}_{month or 'all'}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/budgets/csv")
async def export_budget_summary_csv(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export budget summary (limit vs spent) for a given month/year as CSV.
    """
    q = select(
        Budget.category,
        Budget.limitamount,
        Budget.spentamount,
    ).where(
        Budget.userid == current_user.id,
        Budget.month == month,
        Budget.year == year,
    )

    result = await db.execute(q)
    rows = result.fetchall()

    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No budgets found for the selected period",
        )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Category", "Limit Amount", "Spent Amount", "Remaining"])

    for r in rows:
        limit_val = float(r.limitamount or 0)
        spent_val = float(r.spentamount or 0)
        writer.writerow(
            [
                r.category or "Uncategorized",
                limit_val,
                spent_val,
                round(limit_val - spent_val, 2),
            ]
        )

    csv_data = output.getvalue()
    output.close()

    filename = f"budget_summary_{year}_{month}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
