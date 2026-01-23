from sqlalchemy.orm import Session
from app.models.category_rule import CategoryRule


def auto_assign_category(description: str, user_id: int, db: Session):
    if not description:
        return "Others"

    rules = (
        db.query(CategoryRule)
        .filter(CategoryRule.user_id == user_id)
        .all()
    )

    desc = description.lower()

    for rule in rules:
        keywords = rule.keywords.split(",")
        for kw in keywords:
            if kw.strip().lower() in desc:
                return rule.category_name   # ✅ FIXED

    return "Others"
