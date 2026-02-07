from app.models.account import Account   # ✅ ADD THIS IMPORT AT TOP
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, extract
from app.models.transaction import Transaction

from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.budget import Budget
from app.models.user import User
from app.core.security import get_current_user
from app.services.budgets_service import calculate_spent

router = APIRouter(
    prefix="/budgets",
    tags=["Budgets"]
)

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
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Invalid month")

    if limit_amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid budget amount")

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

    return {
        "message": "Budget created successfully",
        "budget_id": budget.id
    }


# =========================
# ✅ GET ALL BUDGETS (FIXED)
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

    for budget in budgets:
        spent = calculate_spent(
            db=db,
            user_id=current_user.id,
            category=budget.category,
            month=budget.month,
            year=budget.year
        )

        progress = (
            round((spent / budget.limit_amount) * 100, 2)
            if budget.limit_amount > 0
            else 0
        )

        result.append({
            "id": budget.id,
            "category": budget.category,
            "month": budget.month,
            "year": budget.year,
            "limit": budget.limit_amount,
            "spent": spent,
            "remaining": budget.limit_amount - spent,
            "progress": progress,
            "status": "Exceeded" if spent > budget.limit_amount else "Within Limit"
        })

    return result


# =========================
# UPDATE BUDGET
# =========================
@router.put("/{budget_id}")
def update_budget(
    budget_id: int,
    category: str,
    limit_amount: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if limit_amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid limit amount")

    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
        .first()
    )

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    # ✅ Update limit
    budget.limit_amount = limit_amount

    # ✅ Get user's account IDs (SAFE & CORRECT)
    accounts = db.query(Account.id).filter(
        Account.owner_id == current_user.id
    ).all()
    account_ids = [a.id for a in accounts]

    # ✅ Recalculate spent (CORRECT LOGIC)
    total_spent = (
        db.query(func.coalesce(func.sum(Transaction.amount), 0))
        .filter(
            Transaction.category == budget.category,
            extract("month", Transaction.created_at) == budget.month,
            extract("year", Transaction.created_at) == budget.year,
            Transaction.from_account_id.in_(account_ids)
        )
        .scalar()
    )

    db.commit()
    db.refresh(budget)

    return {
        "message": "Budget updated successfully",
        "spent": total_spent,
        "over_budget": total_spent > limit_amount
    }
@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == current_user.id
        )
        .first()
    )

    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")

    db.delete(budget)
    db.commit()

    return {"message": "Budget deleted successfully"}
