from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..database import get_db
from ..deps import get_current_user
from ..models import CategoryRule

router = APIRouter(prefix="/categories", tags=["Category Rules"])

# --------- SCHEMAS ---------

class RuleCreate(BaseModel):
    category_name: str
    keywords: str  # comma separated

class RuleResponse(BaseModel):
    id: int
    category_name: str
    keywords: str

    class Config:
        orm_mode = True

# --------- ROUTES ---------

# Add a new category rule
@router.post("/", response_model=RuleResponse)
def create_rule(
    data: RuleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    rule = CategoryRule(
        user_id=current_user.id,
        category_name=data.category_name,
        keywords=data.keywords
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

# Get all category rules of logged-in user
@router.get("/", response_model=List[RuleResponse])
def list_rules(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return db.query(CategoryRule).filter(
        CategoryRule.user_id == current_user.id
    ).all()

# Delete a rule
@router.delete("/{rule_id}")
def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    rule = db.query(CategoryRule).filter(
        CategoryRule.id == rule_id,
        CategoryRule.user_id == current_user.id
    ).first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()
    return {"message": "Rule deleted"}
