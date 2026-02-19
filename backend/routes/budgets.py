"""
Budget Management Router
Handles monthly budget tracking and spending analysis
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime
import csv
import io
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from auth.jwt_handler import get_current_user
from database import get_db
from model import User, Budget, Transaction, TransactionType, Account
from routes.budgets_schema import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    BudgetSummary,
)

router = APIRouter(prefix="/budgets", tags=["Budgets"])


# ============================================
# 1. CREATE BUDGET
# ============================================
@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    payload: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a monthly budget for a specific category.
    Prevents duplicate budgets for same category + month + year.
    """

    # Check for duplicate budget
    existing_query = select(Budget).where(
        Budget.user_id == current_user.id,
        Budget.category == payload.category,
        Budget.month == payload.month,
        Budget.year == payload.year,
    )
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalars().first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Budget for '{payload.category}' already exists for {payload.month}/{payload.year}",
        )

    # Create new budget
    new_budget = Budget(
        user_id=current_user.id,
        month=payload.month,
        year=payload.year,
        category=payload.category,
        limit_amount=payload.limit_amount,
        spent_amount=0.0,
    )

    db.add(new_budget)
    await db.commit()
    await db.refresh(new_budget)

    # Calculate spending for this category/month/year
    spent = await calculate_spent_amount(
        db=db,
        user_id=current_user.id,
        category=payload.category,
        month=payload.month,
        year=payload.year,
    )

    # Update spent amount
    new_budget.spent_amount = spent
    await db.commit()
    await db.refresh(new_budget)

    # Calculate derived fields
    remaining = float(new_budget.limit_amount) - float(new_budget.spent_amount)
    is_over_budget = remaining < 0

    return BudgetResponse(
        id=new_budget.id,
        user_id=new_budget.user_id,
        month=new_budget.month,
        year=new_budget.year,
        category=new_budget.category,
        limit_amount=float(new_budget.limit_amount),
        spent_amount=float(new_budget.spent_amount),
        remaining=remaining,
        is_over_budget=is_over_budget,
        created_at=new_budget.created_at,
    )


# ============================================
# 2. LIST ALL BUDGETS FOR CURRENT USER
# ============================================
@router.get("/", response_model=List[BudgetSummary])
async def list_budgets(
    month: int = None,
    year: int = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all budgets for the authenticated user.
    Optional filters: month, year
    """

    query = select(Budget).where(Budget.user_id == current_user.id)

    # Apply filters if provided
    if month:
        query = query.where(Budget.month == month)
    if year:
        query = query.where(Budget.year == year)

    query = query.order_by(Budget.year.desc(), Budget.month.desc())

    result = await db.execute(query)
    budgets = result.scalars().all()

    # Build response with calculations
    budget_summaries = []
    for budget in budgets:
        # Recalculate spent amount (for real-time accuracy)
        spent = await calculate_spent_amount(
            db=db,
            user_id=current_user.id,
            category=budget.category,
            month=budget.month,
            year=budget.year,
        )

        limit = float(budget.limit_amount)
        remaining = limit - spent
        is_over_budget = remaining < 0
        percentage_used = (spent / limit * 100) if limit > 0 else 0

        budget_summaries.append(
            BudgetSummary(
                budget_id=budget.id,
                category=budget.category,
                month=budget.month,
                year=budget.year,
                limit_amount=limit,
                spent_amount=spent,
                remaining=remaining,
                is_over_budget=is_over_budget,
                percentage_used=round(percentage_used, 2),
            )
        )

    return budget_summaries


# ============================================
# 3. GET SINGLE BUDGET WITH SPENDING DETAILS
# ============================================
@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific budget"""

    query = select(Budget).where(
        Budget.id == budget_id, Budget.user_id == current_user.id
    )
    result = await db.execute(query)
    budget = result.scalars().first()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found"
        )

    # Recalculate spent amount
    spent = await calculate_spent_amount(
        db=db,
        user_id=current_user.id,
        category=budget.category,
        month=budget.month,
        year=budget.year,
    )

    budget.spent_amount = spent
    await db.commit()
    await db.refresh(budget)

    remaining = float(budget.limit_amount) - float(budget.spent_amount)
    is_over_budget = remaining < 0

    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        month=budget.month,
        year=budget.year,
        category=budget.category,
        limit_amount=float(budget.limit_amount),
        spent_amount=float(budget.spent_amount),
        remaining=remaining,
        is_over_budget=is_over_budget,
        created_at=budget.created_at,
    )


# ============================================
# 4. UPDATE BUDGET LIMIT
# ============================================
@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: int,
    payload: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update budget limit amount"""

    query = select(Budget).where(
        Budget.id == budget_id, Budget.user_id == current_user.id
    )
    result = await db.execute(query)
    budget = result.scalars().first()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found"
        )

    # Update limit
    budget.limit_amount = payload.limit_amount

    # Recalculate spent amount
    spent = await calculate_spent_amount(
        db=db,
        user_id=current_user.id,
        category=budget.category,
        month=budget.month,
        year=budget.year,
    )
    budget.spent_amount = spent

    await db.commit()
    await db.refresh(budget)

    remaining = float(budget.limit_amount) - float(budget.spent_amount)
    is_over_budget = remaining < 0

    return BudgetResponse(
        id=budget.id,
        user_id=budget.user_id,
        month=budget.month,
        year=budget.year,
        category=budget.category,
        limit_amount=float(budget.limit_amount),
        spent_amount=float(budget.spent_amount),
        remaining=remaining,
        is_over_budget=is_over_budget,
        created_at=budget.created_at,
    )


# ============================================
# 5. DELETE BUDGET
# ============================================
@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a budget"""

    query = select(Budget).where(
        Budget.id == budget_id, Budget.user_id == current_user.id
    )
    result = await db.execute(query)
    budget = result.scalars().first()

    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found"
        )

    await db.delete(budget)
    await db.commit()

    return None


# ============================================
# HELPER FUNCTION: Calculate Spent Amount
# ============================================
async def calculate_spent_amount(
    db: AsyncSession, user_id: int, category: str, month: int, year: int
) -> float:
    """
    Calculate total spent for a category in a specific month/year.
    Only counts DEBIT transactions.
    """

    # Get user's account IDs
    accounts_query = select(Account.id).where(Account.user_id == user_id)
    accounts_result = await db.execute(accounts_query)
    account_ids = [acc_id for acc_id, in accounts_result.fetchall()]

    if not account_ids:
        return 0.0

    # Sum debit transactions for this category in the specified month/year
    spent_query = select(func.sum(Transaction.amount)).where(
        Transaction.account_id.in_(account_ids),
        Transaction.category == category,
        Transaction.txn_type == TransactionType.debit,
        func.extract("month", Transaction.txn_date) == month,
        func.extract("year", Transaction.txn_date) == year,
    )

    result = await db.execute(spent_query)
    spent = result.scalar() or 0.0

    return float(spent)


# ========================================================
# reports
# ========================================================
@router.get("/export-summary-csv", response_class=StreamingResponse)
async def export_budget_summary_csv(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export current user's budgets summary as CSV.
    One row per budget: month, year, category, limit, spent, remaining, utilization%.
    """
    query = (
        select(Budget)
        .where(Budget.user_id == current_user.id)
        .order_by(Budget.year.desc(), Budget.month.desc(), Budget.category.asc())
    )
    result = await db.execute(query)
    budgets = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(
        [
            "month",
            "year",
            "category",
            "limit_amount",
            "spent_amount",
            "remaining",
            "utilization_percent",
        ]
    )

    for b in budgets:
        limit_val = float(b.limit_amount or 0)
        spent_val = float(b.spent_amount or 0)
        remaining = limit_val - spent_val
        util = (spent_val / limit_val * 100) if limit_val > 0 else 0.0

        writer.writerow(
            [
                b.month,
                b.year,
                b.category or "",
                f"{limit_val:.2f}",
                f"{spent_val:.2f}",
                f"{remaining:.2f}",
                f"{util:.2f}",
            ]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="budget_summary.csv"'},
    )


@router.get("/export-summary-pdf", response_class=StreamingResponse)
async def export_budget_summary_pdf(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export current user's budgets summary as a simple PDF report.
    One row per budget: month/year, category, limit, spent, remaining, utilization%.
    """
    query = (
        select(Budget)
        .where(Budget.user_id == current_user.id)
        .order_by(Budget.year.desc(), Budget.month.desc(), Budget.category.asc())
    )
    result = await db.execute(query)
    budgets = result.scalars().all()

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 50
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, y, "Budget Summary")
    y -= 25

    c.setFont("Helvetica", 10)
    header = "Month/Year | Category | Limit | Spent | Remaining | Util %"
    c.drawString(50, y, header)
    y -= 18

    for b in budgets:
        limit_val = float(b.limit_amount or 0)
        spent_val = float(b.spent_amount or 0)
        remaining = limit_val - spent_val
        util = (spent_val / limit_val * 100) if limit_val > 0 else 0.0

        line = (
            f"{b.month:02d}/{b.year} | "
            f"{(b.category or '')[:18]:18} | "
            f"{limit_val:10.2f} | "
            f"{spent_val:10.2f} | "
            f"{remaining:10.2f} | "
            f"{util:5.1f}%"
        )

        if y < 50:
            c.showPage()
            c.setFont("Helvetica", 10)
            y = height - 50

        c.drawString(50, y, line[:120])
        y -= 14

    c.showPage()
    c.save()
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="budget_summary.pdf"'},
    )
