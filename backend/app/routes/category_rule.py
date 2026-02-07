from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.models.category_rule import CategoryRule
from app.schemas.category_rule import CategoryRuleCreate, CategoryRuleOut
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

# =========================
# CREATE CATEGORY RULE
# =========================
@router.post("/", response_model=CategoryRuleOut)
def create_category(
    rule: CategoryRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = CategoryRule(
        category_name=rule.category_name,
        keywords=rule.keywords,
        user_id=current_user.id
    )

    db.add(category)
    db.commit()
    db.refresh(category)
    return category


# =========================
# LIST USER CATEGORY RULES
# =========================
@router.get("/", response_model=list[CategoryRuleOut])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(CategoryRule)
        .filter(CategoryRule.user_id == current_user.id)
        .all()
    )
