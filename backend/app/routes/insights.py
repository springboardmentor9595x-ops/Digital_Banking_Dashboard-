from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime
from collections import defaultdict

from ..database import get_db
from ..deps import get_current_user
from ..models import Transaction

router = APIRouter(prefix="/insights", tags=["Insights"])

def get_user_transactions(db: Session, user_id: int):
    return db.query(Transaction).filter(
        Transaction.user_id == user_id
    ).all()

def calculate_monthly_cashflow(db: Session, user_id: int):

    total_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "income"
    ).scalar() or 0

    total_expense = db.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense"
    ).scalar() or 0

    net_savings = total_income - total_expense

    return {
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "net_savings": float(net_savings)
    }


def calculate_top_merchants(db: Session, user_id: int):
    results = db.query(
        Transaction.description,
        func.sum(Transaction.amount).label("total_spent")
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense"
    ).group_by(
        Transaction.description
    ).order_by(
        desc("total_spent")
    ).limit(5).all()

    return [
        {
            "merchant": r[0],
            "total_spent": float(r[1])
        }
        for r in results
    ]

def calculate_category_summary(db: Session, user_id: int):
    results = db.query(
        Transaction.category,
        func.sum(Transaction.amount).label("total")
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense"
    ).group_by(
        Transaction.category
    ).all()

    return [
        {
            "category": r[0],
            "total": float(r[1])
        }
        for r in results
    ]

def calculate_burn_rate(db: Session, user_id: int):
    results = db.query(
        func.extract("year", Transaction.date),
        func.extract("month", Transaction.date),
        func.sum(Transaction.amount)
    ).filter(
        Transaction.user_id == user_id,
        Transaction.type == "expense"
    ).group_by(
        func.extract("year", Transaction.date),
        func.extract("month", Transaction.date)
    ).all()

    if not results:
        return 0

    monthly_totals = [float(r[2]) for r in results]
    average = sum(monthly_totals) / len(monthly_totals)

    return round(average, 2)

@router.get("/summary")
def insights_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_id = current_user.id

    return {
        "cashflow": calculate_monthly_cashflow(db, user_id),
        "top_merchants": calculate_top_merchants(db, user_id),
        "category_summary": calculate_category_summary(db, user_id),
        "burn_rate": calculate_burn_rate(db, user_id)
    }
