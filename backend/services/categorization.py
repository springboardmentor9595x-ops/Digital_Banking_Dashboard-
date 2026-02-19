"""
Transaction Auto-Categorization Service
Handles automatic category assignment based on rules
"""

from typing import Optional
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from model import CategoryRule


class CategorizationService:
    """Service for managing and applying categorization rules"""

    def __init__(self, db: AsyncSession, user_id: int):
        self.db = db
        self.user_id = user_id

    async def get_all_categories(self) -> list[str]:
        """Get list of all available category names (defaults + user customs)"""
        query = (
            select(CategoryRule.category_name)
            .where(
                or_(
                    CategoryRule.is_default == True,
                    CategoryRule.user_id == self.user_id,
                )
            )
            .distinct()
        )

        result = await self.db.execute(query)
        categories = [cat for cat, in result.fetchall()]
        return sorted(categories)

    async def get_category_details(self, category_name: str) -> Optional[CategoryRule]:
        """Get detailed rule for a specific category"""
        # First check for user's custom category
        query = select(CategoryRule).where(
            CategoryRule.user_id == self.user_id,
            CategoryRule.category_name == category_name,
        )
        result = await self.db.execute(query)
        custom_rule = result.scalars().first()

        if custom_rule:
            return custom_rule

        # Fall back to default category
        query = select(CategoryRule).where(
            CategoryRule.is_default == True, CategoryRule.category_name == category_name
        )
        result = await self.db.execute(query)
        return result.scalars().first()


async def auto_categorize(
    db: AsyncSession,
    merchant: Optional[str] = None,
    description: Optional[str] = None,
    user_id: Optional[int] = None,
) -> str:
    """
    Auto-categorize a transaction based on merchant and description.

    ✅ PRIORITY ORDER:
    1. User's custom categories (checked first)
    2. System default categories (checked second)

    Returns: Category name or "Uncategorized"
    """

    if not merchant and not description:
        return "Uncategorized"

    merchant_lower = merchant.lower() if merchant else ""
    description_lower = description.lower() if description else ""

    # ✅ STEP 1: Check user's custom categories FIRST (highest priority)
    if user_id:
        custom_query = (
            select(CategoryRule)
            .where(CategoryRule.user_id == user_id)
            .order_by(
                CategoryRule.priority.asc()
            )  # Lower priority number = higher priority
        )
        custom_result = await db.execute(custom_query)
        custom_rules = custom_result.scalars().all()

        for rule in custom_rules:
            # Check merchant match
            if rule.merchants:
                for rule_merchant in rule.merchants:
                    if rule_merchant.lower() in merchant_lower:
                        return rule.category_name

            # Check keyword match
            if rule.keywords:
                for keyword in rule.keywords:
                    if keyword.lower() in description_lower:
                        return rule.category_name

    # ✅ STEP 2: Check system default categories SECOND (lower priority)
    default_query = (
        select(CategoryRule)
        .where(CategoryRule.is_default == True)
        .order_by(CategoryRule.priority.asc())
    )
    default_result = await db.execute(default_query)
    default_rules = default_result.scalars().all()

    for rule in default_rules:
        # Check merchant match
        if rule.merchants:
            for rule_merchant in rule.merchants:
                if rule_merchant.lower() in merchant_lower:
                    return rule.category_name

        # Check keyword match
        if rule.keywords:
            for keyword in rule.keywords:
                if keyword.lower() in description_lower:
                    return rule.category_name

    # No match found
    return "Uncategorized"
