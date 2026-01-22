from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.budget import Budget
from app.models.user import User
from app.core.security import get_current_user
from app.services.budgets_service import calculate_spent


router = APIRouter(prefix="/budgets", tags=["Budgets"])


# =========================
# CREATE BUDGET
# =========================
@router.post("/")
def create_budget(
    month: int,
    year: int,
    category: str,
    limit_amount: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.month == month,
            Budget.year == year,
            Budget.category == category
        )
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="Budget already exists")

    budget = Budget(
        user_id=current_user.id,
        month=month,
        year=year,
        category=category,
        limit_amount=limit_amount
    )

    db.add(budget)
    db.commit()
    db.refresh(budget)

    return budget


# =========================
# GET ALL BUDGETS (FIXED ✅)
# =========================
@router.get("/")
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id)
        .all()
    )

    result = []

    for b in budgets:
        spent = calculate_spent(
            db=db,
            user_id=current_user.id,
            category=b.category,
            month=b.month,
            year=b.year
        )

        result.append({
            "id": b.id,
            "category": b.category,
            "limit_amount": b.limit_amount,
            "spent_amount": spent,
            "remaining_amount": b.limit_amount - spent,
            "over_budget": spent > b.limit_amount,
            "month": b.month,
            "year": b.year
        })

    return result
