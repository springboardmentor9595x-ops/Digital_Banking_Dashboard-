from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.category_rule import CategoryRule
from app.schemas.category_rule import CategoryRuleCreate, CategoryRuleOut
from app.core.security import get_current_user

router = APIRouter(
    prefix="/category-rules",
    tags=["Category Rules"]
)

# =========================
# CREATE CATEGORY RULE
# =========================
@router.post("/", response_model=CategoryRuleOut)
def create_category_rule(
    rule: CategoryRuleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    new_rule = CategoryRule(
        category_name=rule.category_name,
        keywords=rule.keywords,
        user_id=current_user.id
    )

    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule


# =========================
# LIST USER CATEGORY RULES
# =========================
@router.get("/", response_model=list[CategoryRuleOut])
def list_category_rules(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return (
        db.query(CategoryRule)
        .filter(CategoryRule.user_id == current_user.id)
        .all()
    )
