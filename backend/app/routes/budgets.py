from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime
from ..database import get_db
from ..deps import get_current_user
from ..models import Budget
from sqlalchemy import func,extract
from ..models import Transaction
from app.services.alert_service import create_alert


router = APIRouter(prefix="/budgets", tags=["Budgets"])


# ---------- Schemas ----------

class BudgetCreate(BaseModel):
    category: str
    month: int
    year: int
    limit_amount: float


class BudgetResponse(BaseModel):
    id: int
    category: str
    month: int
    year: int
    limit_amount: float

    class Config:
        orm_mode = True


# ---------- Routes ----------

# Create Budget
@router.post("/", response_model=BudgetResponse)
def create_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Prevent duplicate budget for same category + month + year
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == data.category,
        Budget.month == data.month,
        Budget.year == data.year
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Budget already exists for this category and month"
        )

    budget = Budget(
        user_id=current_user.id,
        category=data.category,
        month=data.month,
        year=data.year,
        limit_amount=data.limit_amount
    )

    db.add(budget)
    db.commit()
    db.refresh(budget)

    return budget


# List Budgets of Logged-in User
@router.get("/", response_model=List[BudgetResponse])
def list_budgets(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(Budget).filter(
        Budget.user_id == current_user.id
    ).all()
@router.get("/summary")
def budget_summary(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == month,
        Budget.year == year
    ).all()

    result = []

    for budget in budgets:
        # Sum all expense transactions for this category, month, year
        total_spent = db.query(Transaction).filter(
            Transaction.user_id == current_user.id,
            Transaction.category == budget.category,
            Transaction.type == "expense",
            extract("month", Transaction.date) == month,
            extract("year", Transaction.date) == year
        ).with_entities(
            func.coalesce(func.sum(Transaction.amount), 0)
        ).scalar()

        remaining = float(budget.limit_amount) - float(total_spent)
        if total_spent > budget.limit_amount:
            create_alert(
        db,
        current_user.id,
        "budget_exceeded",
        f"Budget exceeded for {budget.category}"
    )

        result.append({
            "id": budget.id,
            "category": budget.category,
            "limit": float(budget.limit_amount),
            "spent": float(total_spent),
            "remaining": remaining,
            "over_budget": total_spent > budget.limit_amount
        })

    return result
    
# Delete Budget
@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    db.delete(budget)
    db.commit()

    return {"message": "Budget deleted successfully"}

   