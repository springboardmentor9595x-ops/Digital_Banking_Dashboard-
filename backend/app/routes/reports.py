from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import extract

from io import StringIO
import pandas as pd

from app.database import get_db
from app.deps import get_current_user

from app.models import Transaction
from app.models import Budget 

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.platypus import Table
from reportlab.lib.pagesizes import A4
from io import BytesIO


router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/transactions/csv")
def export_transactions_csv(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    transactions = db.query(Transaction)\
        .filter(Transaction.user_id == current_user.id)\
        .all()

    if not transactions:
        raise HTTPException(status_code=404, detail="No transactions found")

    data = []
    for t in transactions:
        data.append({
            "Date": t.date,
            "Type": t.type,
            "Category": t.category,
            "Amount": t.amount,
            "Description": t.description
        })

    df = pd.DataFrame(data)

    stream = StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transactions.csv"}
    )

@router.get("/budgets/csv")
def export_budget_csv(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    budgets = db.query(Budget)\
        .filter(Budget.user_id == current_user.id)\
        .all()

    if not budgets:
        raise HTTPException(status_code=404, detail="No budgets found")

    summary_data = []

    for budget in budgets:
        spent = db.query(Transaction).filter(
    Transaction.user_id == current_user.id,
    Transaction.category == budget.category,
    Transaction.type == "expense",
    extract("month", Transaction.date) == budget.month,
    extract("year", Transaction.date) == budget.year
).all()

        total_spent = sum(float(t.amount) for t in spent)

        limit_value = float(budget.limit_amount)

        summary_data.append({
            "Category": budget.category,
            "Month": budget.month,
            "Year": budget.year,
            "Limit": limit_value,
            "Spent": total_spent,
            "Remaining": limit_value - total_spent
        })

    df = pd.DataFrame(summary_data)

    stream = StringIO()
    df.to_csv(stream, index=False)
    stream.seek(0)

    return StreamingResponse(
        stream,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=budget_summary.csv"}
    )

@router.get("/monthly/pdf")
def generate_monthly_pdf(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    transactions = db.query(Transaction)\
        .filter(Transaction.user_id == current_user.id)\
        .all()

    if not transactions:
        raise HTTPException(status_code=404, detail="No transactions found")

    total_income = sum(t.amount for t in transactions if t.type == "income")
    total_expense = sum(t.amount for t in transactions if t.type == "expense")
    savings = total_income - total_expense

    # Category breakdown
    category_data = {}
    for t in transactions:
        if t.type == "expense":
            category_data[t.category] = category_data.get(t.category, 0) + t.amount

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    styles = getSampleStyleSheet()

    elements.append(Paragraph("Monthly Financial Report", styles["Title"]))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph(f"Total Income: ₹{total_income}", styles["Normal"]))
    elements.append(Paragraph(f"Total Expense: ₹{total_expense}", styles["Normal"]))
    elements.append(Paragraph(f"Savings: ₹{savings}", styles["Normal"]))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph("Category Breakdown", styles["Heading2"]))
    elements.append(Spacer(1, 10))

    table_data = [["Category", "Amount"]]
    for category, amount in category_data.items():
        table_data.append([category, amount])

    table = Table(table_data)
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=monthly_report.pdf"}
    )
