"""
Insights API Router
Provides financial insights and analytics
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from datetime import datetime, timedelta
import csv
import io
from fastapi.responses import StreamingResponse, Response
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from auth.jwt_handler import get_current_user
from database import get_db
from model import User, Transaction, Account, TransactionType, Budget, Bill
from routes.insights_schema import InsightsResponse, MerchantSpending, CategorySpending


router = APIRouter(prefix="/insights", tags=["Insights"])


# ============================================
# Helper Functions
# ============================================


async def get_user_account_ids(db: AsyncSession, user_id: int) -> List[int]:
    """Get all account IDs for a user"""
    query = select(Account.id).where(Account.user_id == user_id)
    result = await db.execute(query)
    return [acc_id for acc_id, in result.fetchall()]


async def calculate_monthly_cash_flow(
    db: AsyncSession, account_ids: List[int], month: int = None, year: int = None
) -> Dict[str, float]:
    """Calculate monthly cash flow (credits, debits, net savings)"""

    if not account_ids:
        return {"total_credits": 0.0, "total_debits": 0.0, "net_savings": 0.0}

    # Use current month/year if not provided
    if month is None or year is None:
        now = datetime.now()
        month = now.month
        year = now.year

    # Total credits (income)
    credits_query = select(func.sum(Transaction.amount)).where(
        Transaction.account_id.in_(account_ids),
        Transaction.txn_type == TransactionType.credit,
        extract("month", Transaction.txn_date) == month,
        extract("year", Transaction.txn_date) == year,
    )
    credits_result = await db.execute(credits_query)
    total_credits = float(credits_result.scalar() or 0)

    # Total debits (expenses)
    debits_query = select(func.sum(Transaction.amount)).where(
        Transaction.account_id.in_(account_ids),
        Transaction.txn_type == TransactionType.debit,
        extract("month", Transaction.txn_date) == month,
        extract("year", Transaction.txn_date) == year,
    )
    debits_result = await db.execute(debits_query)
    total_debits = float(debits_result.scalar() or 0)

    return {
        "total_credits": round(total_credits, 2),
        "total_debits": round(total_debits, 2),
        "net_savings": round(total_credits - total_debits, 2),
    }


async def get_top_merchants(
    db: AsyncSession, account_ids: List[int], limit: int = 5
) -> List[MerchantSpending]:
    """Get top merchants by spending"""

    if not account_ids:
        return []

    query = (
        select(Transaction.merchant, func.sum(Transaction.amount).label("total_spent"))
        .where(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == TransactionType.debit,
            Transaction.merchant.isnot(None),
            Transaction.merchant != "",
        )
        .group_by(Transaction.merchant)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(limit)
    )

    result = await db.execute(query)
    merchants = result.fetchall()

    return [
        MerchantSpending(
            merchant=merchant or "Unknown", total_spent=round(float(total), 2)
        )
        for merchant, total in merchants
    ]


async def get_category_spending(
    db: AsyncSession, account_ids: List[int]
) -> List[CategorySpending]:
    """Get category-wise spending summary"""

    if not account_ids:
        return []

    query = (
        select(Transaction.category, func.sum(Transaction.amount).label("total_spent"))
        .where(
            Transaction.account_id.in_(account_ids),
            Transaction.txn_type == TransactionType.debit,
        )
        .group_by(Transaction.category)
        .order_by(func.sum(Transaction.amount).desc())
    )

    result = await db.execute(query)
    categories = result.fetchall()

    return [
        CategorySpending(
            category=category or "Uncategorized", total_spent=round(float(total), 2)
        )
        for category, total in categories
    ]


async def calculate_burn_rate(
    db: AsyncSession, account_ids: List[int], months: int = 3
) -> float:
    """Calculate average monthly spending over last N months"""

    if not account_ids:
        return 0.0

    # Get date range
    end_date = datetime.now()
    start_date = end_date - timedelta(days=months * 30)

    # Calculate total spending in period
    query = select(func.sum(Transaction.amount)).where(
        Transaction.account_id.in_(account_ids),
        Transaction.txn_type == TransactionType.debit,
        Transaction.txn_date >= start_date,
        Transaction.txn_date <= end_date,
    )

    result = await db.execute(query)
    total_spent = float(result.scalar() or 0)

    # Calculate average
    return round(total_spent / months, 2) if months > 0 else 0.0


# ============================================
# Main Insights Endpoint
# ============================================


@router.get("/", response_model=InsightsResponse)
async def get_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get comprehensive financial insights for logged-in user

    Returns:
    - Monthly cash flow (credits, debits, net savings)
    - Top 5 merchants by spending
    - Category-wise spending summary
    - Monthly burn rate (average spending over 3 months)
    """

    # Get user's account IDs
    account_ids = await get_user_account_ids(db, current_user.id)

    if not account_ids:
        # Return empty insights if user has no accounts
        return InsightsResponse(
            monthly_cash_flow={
                "total_credits": 0.0,
                "total_debits": 0.0,
                "net_savings": 0.0,
            },
            top_merchants=[],
            category_spending=[],
            burn_rate=0.0,
        )

    # Calculate all insights in parallel
    cash_flow = await calculate_monthly_cash_flow(db, account_ids)
    top_merchants = await get_top_merchants(db, account_ids, limit=5)
    category_spending = await get_category_spending(db, account_ids)
    burn_rate = await calculate_burn_rate(db, account_ids, months=3)

    return InsightsResponse(
        monthly_cash_flow=cash_flow,
        top_merchants=top_merchants,
        category_spending=category_spending,
        burn_rate=burn_rate,
    )


@router.get("/cash-flow")
async def get_cash_flow_only(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get only monthly cash flow data"""
    account_ids = await get_user_account_ids(db, current_user.id)
    cash_flow = await calculate_monthly_cash_flow(db, account_ids)
    return cash_flow


@router.get("/merchants")
async def get_top_merchants_only(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 5,
):
    """Get only top merchants data"""
    account_ids = await get_user_account_ids(db, current_user.id)
    merchants = await get_top_merchants(db, account_ids, limit=limit)
    return {"top_merchants": merchants}


@router.get("/categories")
async def get_category_spending_only(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get only category spending data"""
    account_ids = await get_user_account_ids(db, current_user.id)
    categories = await get_category_spending(db, account_ids)
    return {"category_spending": categories}


@router.get("/export-csv")
async def export_insights_csv(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export comprehensive dashboard insights including:
    - Cash Flow Summary
    - Budget vs Spending (all categories)
    - Top Spending Categories
    - Bills Summary
    - Monthly Summary
    """

    account_ids = await get_user_account_ids(db, current_user.id)

    # Fetch all data
    cash_flow = await calculate_monthly_cash_flow(db, account_ids, month, year)
    merchants = await get_top_merchants(db, account_ids)
    categories = await get_category_spending(db, account_ids)
    burn_rate = await calculate_burn_rate(db, account_ids)

    # Get budgets for the month
    budgets_query = (
        select(Budget)
        .where(
            Budget.user_id == current_user.id,
            Budget.month == month,
            Budget.year == year,
        )
        .order_by(Budget.category.asc())
    )
    budget_result = await db.execute(budgets_query)
    budgets = budget_result.scalars().all()

    # Get bills for the month
    bills_query = (
        select(Bill)
        .where(
            Bill.user_id == current_user.id,
            extract("month", Bill.due_date) == month,
            extract("year", Bill.due_date) == year,
        )
        .order_by(Bill.due_date.asc())
    )
    bills_result = await db.execute(bills_query)
    bills = bills_result.scalars().all()

    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header with metadata
    writer.writerow([f"Financial Insights Report - {month}/{year}"])
    writer.writerow([f"Generated: {datetime.now().strftime('%d %b %Y, %I:%M %p')}"])
    writer.writerow([])

    # === MONTHLY SUMMARY ===
    writer.writerow(["=== MONTHLY SUMMARY ==="])
    writer.writerow(["Metric", "Amount (₹)"])
    writer.writerow(["Total Income", f"{cash_flow['total_credits']:,.2f}"])
    writer.writerow(["Total Expenses", f"{cash_flow['total_debits']:,.2f}"])
    writer.writerow(["Net Savings", f"{cash_flow['net_savings']:,.2f}"])
    writer.writerow(["Average Monthly Burn Rate", f"{burn_rate:,.2f}"])
    writer.writerow([])

    # === BUDGET VS SPENDING ===
    writer.writerow(["=== BUDGET VS SPENDING ==="])
    writer.writerow(["Category", "Budget Limit", "Spent Amount", "Remaining", "Status"])

    for b in budgets:
        limit_val = float(b.limit_amount or 0)
        spent_val = float(b.spent_amount or 0)
        remaining = limit_val - spent_val
        status = "Over Budget" if remaining < 0 else "Within Budget"

        writer.writerow(
            [
                b.category or "Uncategorized",
                f"{limit_val:,.2f}",
                f"{spent_val:,.2f}",
                f"{remaining:,.2f}",
                status,
            ]
        )

    writer.writerow([])

    # === TOP SPENDING CATEGORIES ===
    writer.writerow(["=== TOP SPENDING CATEGORIES ==="])
    writer.writerow(["Category", "Total Spent (₹)", "% of Total"])

    total_spent = sum(c.total_spent for c in categories)

    for c in categories[:10]:  # Top 10
        percentage = (c.total_spent / total_spent * 100) if total_spent > 0 else 0
        writer.writerow([c.category, f"{c.total_spent:,.2f}", f"{percentage:.1f}%"])

    writer.writerow([])

    # === TOP MERCHANTS ===
    writer.writerow(["=== TOP MERCHANTS ==="])
    writer.writerow(["Merchant", "Total Spent (₹)"])

    for m in merchants:
        writer.writerow([m.merchant, f"{m.total_spent:,.2f}"])

    writer.writerow([])

    # === BILLS SUMMARY ===
    writer.writerow(["=== BILLS SUMMARY ==="])
    writer.writerow(["Biller", "Due Date", "Amount (₹)", "Status", "Auto Pay"])

    for bill in bills:
        writer.writerow(
            [
                bill.biller_name,
                bill.due_date.strftime("%Y-%m-%d"),
                f"{float(bill.amount_due):,.2f}",
                bill.status.value,
                "Yes" if bill.auto_pay else "No",
            ]
        )

    if not bills:
        writer.writerow(["No bills scheduled for this month"])

    writer.writerow([])

    # === CASHFLOW BREAKDOWN ===
    writer.writerow(["=== CASHFLOW ANALYSIS ==="])
    writer.writerow(["Type", "Amount (₹)"])
    writer.writerow(["Credits (Income)", f"{cash_flow['total_credits']:,.2f}"])
    writer.writerow(["Debits (Expenses)", f"{cash_flow['total_debits']:,.2f}"])
    writer.writerow(["Net Cashflow", f"{cash_flow['net_savings']:,.2f}"])

    output.seek(0)
    filename = f"monthly_summary_{month}_{year}.csv"

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export-pdf")
async def export_insights_pdf(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export comprehensive dashboard insights as formatted PDF
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import (
        SimpleDocTemplate,
        Table,
        TableStyle,
        Paragraph,
        Spacer,
        PageBreak,
    )
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch

    account_ids = await get_user_account_ids(db, current_user.id)

    # Fetch all data (same as CSV)
    cash_flow = await calculate_monthly_cash_flow(db, account_ids, month, year)
    merchants = await get_top_merchants(db, account_ids)
    categories = await get_category_spending(db, account_ids)
    burn_rate = await calculate_burn_rate(db, account_ids)

    # Get budgets
    budgets_query = (
        select(Budget)
        .where(
            Budget.user_id == current_user.id,
            Budget.month == month,
            Budget.year == year,
        )
        .order_by(Budget.category.asc())
    )
    budget_result = await db.execute(budgets_query)
    budgets = budget_result.scalars().all()

    # Get bills
    bills_query = (
        select(Bill)
        .where(
            Bill.user_id == current_user.id,
            extract("month", Bill.due_date) == month,
            extract("year", Bill.due_date) == year,
        )
        .order_by(Bill.due_date.asc())
    )
    bills_result = await db.execute(bills_query)
    bills = bills_result.scalars().all()

    # Create PDF using SimpleDocTemplate for better formatting
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50,
    )

    # Container for PDF elements
    elements = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=18,
        textColor=colors.HexColor("#1a365d"),
        spaceAfter=30,
        alignment=1,  # Center
    )

    heading_style = ParagraphStyle(
        "CustomHeading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#2d3748"),
        spaceAfter=12,
        spaceBefore=20,
    )

    # Title
    title = Paragraph(f"Financial Insights Report - {month}/{year}", title_style)
    elements.append(title)

    subtitle = Paragraph(
        f"Generated: {datetime.now().strftime('%d %b %Y, %I:%M %p')}", styles["Normal"]
    )
    elements.append(subtitle)
    elements.append(Spacer(1, 0.3 * inch))

    # === MONTHLY SUMMARY ===
    elements.append(Paragraph("Monthly Summary", heading_style))

    summary_data = [
        ["Metric", "Amount (₹)"],
        ["Total Income", f"₹{cash_flow['total_credits']:,.2f}"],
        ["Total Expenses", f"₹{cash_flow['total_debits']:,.2f}"],
        ["Net Savings", f"₹{cash_flow['net_savings']:,.2f}"],
        ["Avg. Monthly Burn", f"₹{burn_rate:,.2f}"],
    ]

    summary_table = Table(summary_data, colWidths=[3 * inch, 2 * inch])
    summary_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4299e1")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 11),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 10),
                ("TOPPADDING", (0, 1), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 8),
            ]
        )
    )

    elements.append(summary_table)
    elements.append(Spacer(1, 0.3 * inch))

    # === BUDGET VS SPENDING ===
    if budgets:
        elements.append(Paragraph("Budget vs Spending", heading_style))

        budget_data = [["Category", "Budget", "Spent", "Remaining", "Status"]]

        for b in budgets:
            limit_val = float(b.limit_amount or 0)
            spent_val = float(b.spent_amount or 0)
            remaining = limit_val - spent_val
            status = "Over" if remaining < 0 else "OK"

            budget_data.append(
                [
                    b.category or "Uncategorized",
                    f"₹{limit_val:,.0f}",
                    f"₹{spent_val:,.0f}",
                    f"₹{remaining:,.0f}",
                    status,
                ]
            )

        budget_table = Table(
            budget_data,
            colWidths=[2 * inch, 1.2 * inch, 1.2 * inch, 1.2 * inch, 0.8 * inch],
        )
        budget_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#48bb78")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.lightgrey),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                    ("TOPPADDING", (0, 1), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                ]
            )
        )

        elements.append(budget_table)
        elements.append(Spacer(1, 0.3 * inch))

    # === TOP SPENDING CATEGORIES ===
    if categories:
        elements.append(Paragraph("Top Spending Categories", heading_style))

        category_data = [["Category", "Total Spent", "% of Total"]]
        total_spent = sum(c.total_spent for c in categories)

        for c in categories[:8]:
            percentage = (c.total_spent / total_spent * 100) if total_spent > 0 else 0
            category_data.append(
                [c.category, f"₹{c.total_spent:,.2f}", f"{percentage:.1f}%"]
            )

        category_table = Table(
            category_data, colWidths=[3 * inch, 1.5 * inch, 1 * inch]
        )
        category_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ed8936")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.lightgoldenrodyellow),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                    ("TOPPADDING", (0, 1), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                ]
            )
        )

        elements.append(category_table)
        elements.append(Spacer(1, 0.3 * inch))

    # === TOP MERCHANTS ===
    if merchants:
        elements.append(Paragraph("Top Merchants", heading_style))

        merchant_data = [["Merchant", "Total Spent"]]

        for m in merchants:
            merchant_data.append([m.merchant, f"₹{m.total_spent:,.2f}"])

        merchant_table = Table(merchant_data, colWidths=[3.5 * inch, 2 * inch])
        merchant_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#9f7aea")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.lavender),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                    ("TOPPADDING", (0, 1), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                ]
            )
        )

        elements.append(merchant_table)
        elements.append(Spacer(1, 0.3 * inch))

    # === BILLS SUMMARY ===
    if bills:
        elements.append(Paragraph("Bills Summary", heading_style))

        bills_data = [["Biller", "Due Date", "Amount", "Status", "Auto Pay"]]

        for bill in bills:
            bills_data.append(
                [
                    bill.biller_name,
                    bill.due_date.strftime("%d %b"),
                    f"₹{float(bill.amount_due):,.0f}",
                    bill.status.value.upper(),
                    "✓" if bill.auto_pay else "✗",
                ]
            )

        bills_table = Table(
            bills_data, colWidths=[2 * inch, 1 * inch, 1.2 * inch, 1 * inch, 0.8 * inch]
        )
        bills_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e53e3e")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("ALIGN", (2, 1), (2, -1), "RIGHT"),
                    ("ALIGN", (4, 1), (4, -1), "CENTER"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.mistyrose),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                    ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                    ("TOPPADDING", (0, 1), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
                ]
            )
        )

        elements.append(bills_table)
    else:
        elements.append(
            Paragraph("No bills scheduled for this month", styles["Normal"])
        )

    # Build PDF
    doc.build(elements)
    buffer.seek(0)

    filename = f"monthly_summary_{month}_{year}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
