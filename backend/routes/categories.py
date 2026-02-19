"""
Categories Management Router
Handles both system default categories and user custom categories
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from auth.jwt_handler import get_current_user
from database import get_db
from model import User, CategoryRule
from routes.categories_schema import (
    CategoryResponse,
    CategoryListResponse,
    CategorizationPreviewRequest,
    CustomCategoryCreateRequest,
    CustomCategoryUpdateRequest,
)
from services.categorization import auto_categorize, CategorizationService

router = APIRouter(prefix="/categories", tags=["Categories"])


# ============================================
# 1. LIST ALL CATEGORY NAMES
# ============================================
@router.get("/", response_model=CategoryListResponse)
async def list_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get list of all available category names (defaults + user customs)"""
    service = CategorizationService(db, current_user.id)
    categories = await service.get_all_categories()

    return {"categories": categories}


# ============================================
# 2. GET ALL CATEGORY RULES (DETAILED)
# ============================================
@router.get("/rules", response_model=List[CategoryResponse])
async def list_category_rules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed category rules including keywords and merchants.
    Returns both system defaults and user's custom categories.
    """
    # Fetch default categories + user's custom categories
    query = (
        select(CategoryRule)
        .where(
            or_(
                CategoryRule.is_default == True, CategoryRule.user_id == current_user.id
            )
        )
        .order_by(CategoryRule.priority.asc(), CategoryRule.category_name.asc())
    )

    result = await db.execute(query)
    rules = result.scalars().all()

    return rules


# ============================================
# 3. GET SINGLE CATEGORY DETAILS
# ============================================
@router.get("/{category_name}", response_model=CategoryResponse)
async def get_category_details(
    category_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full details of a specific category"""
    service = CategorizationService(db, current_user.id)
    category = await service.get_category_details(category_name)

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category '{category_name}' not found",
        )

    return category


# ============================================
# 4. PREVIEW CATEGORIZATION
# ============================================
@router.post("/preview")
async def preview_categorization(
    payload: CategorizationPreviewRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Test what category a transaction would get"""

    if not payload.merchant and not payload.description:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least merchant or description",
        )

    category = await auto_categorize(
        db=db,
        merchant=payload.merchant,
        description=payload.description,
        user_id=current_user.id,
    )

    return {
        "merchant": payload.merchant,
        "description": payload.description,
        "predicted_category": category,
    }


# ============================================
# 5. GET CATEGORY STATISTICS
# ============================================
@router.get("/stats/{category_name}")
async def get_category_stats(
    category_name: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get spending statistics for a specific category"""
    from model import Transaction, TransactionType, Account
    from sqlalchemy import func

    # Get user's account IDs
    accounts_query = select(Account.id).where(Account.user_id == current_user.id)
    accounts_result = await db.execute(accounts_query)
    account_ids = [acc_id for acc_id, in accounts_result.fetchall()]

    if not account_ids:
        return {
            "category": category_name,
            "transaction_count": 0,
            "total_spent": 0.0,
            "average_amount": 0.0,
        }

    # Query transactions in this category
    stats_query = select(
        func.count(Transaction.id).label("count"),
        func.sum(Transaction.amount).label("total"),
        func.avg(Transaction.amount).label("average"),
    ).where(
        Transaction.account_id.in_(account_ids),
        Transaction.category == category_name,
        Transaction.txn_type == TransactionType.debit,
    )

    result = await db.execute(stats_query)
    stats = result.first()

    return {
        "category": category_name,
        "transaction_count": stats.count or 0,
        "total_spent": float(stats.total or 0),
        "average_amount": float(stats.average or 0),
    }


# ============================================
# 6. CREATE CUSTOM CATEGORY (USER-SPECIFIC)
# ============================================
@router.post(
    "/custom", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED
)
async def create_custom_category(
    payload: CustomCategoryCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a custom category rule for the current user.
    Custom rules have priority 100 (same as system defaults).
    User-specific categories override defaults due to user_id matching.
    """

    # Check if category name already exists for this user
    existing_query = select(CategoryRule).where(
        CategoryRule.user_id == current_user.id,
        CategoryRule.category_name == payload.category_name,
    )
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalars().first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have a custom category named '{payload.category_name}'",
        )

    # ✅ UPDATED: Create new custom category with priority = 100 (auto-set)
    new_category = CategoryRule(
        user_id=current_user.id,
        category_name=payload.category_name,
        keywords=payload.keywords or [],
        merchants=payload.merchants or [],
        is_default=False,
        priority=100,  # ✅ Always 100 for custom categories
    )

    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)

    return new_category


# ============================================
# 7. LIST USER'S CUSTOM CATEGORIES ONLY
# ============================================
@router.get("/custom/my-categories", response_model=List[CategoryResponse])
async def list_my_custom_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get only the user's custom categories (excludes system defaults)"""

    query = (
        select(CategoryRule)
        .where(CategoryRule.user_id == current_user.id)
        .order_by(CategoryRule.priority.asc(), CategoryRule.category_name.asc())
    )

    result = await db.execute(query)
    custom_categories = result.scalars().all()

    return custom_categories


# ============================================
# 8. UPDATE CUSTOM CATEGORY
# ============================================
@router.put("/custom/{category_id}", response_model=CategoryResponse)
async def update_custom_category(
    category_id: int,
    payload: CustomCategoryUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's custom category"""

    # Find category and verify ownership
    query = select(CategoryRule).where(
        CategoryRule.id == category_id, CategoryRule.user_id == current_user.id
    )
    result = await db.execute(query)
    category = result.scalars().first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom category not found or you don't have permission to edit it",
        )

    # Prevent editing system defaults
    if category.is_default:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot edit system default categories",
        )

    # ✅ UPDATED: Apply updates (only non-None fields, NO priority)
    if payload.category_name is not None:
        category.category_name = payload.category_name

    if payload.keywords is not None:
        category.keywords = payload.keywords

    if payload.merchants is not None:
        category.merchants = payload.merchants

    # ✅ Priority remains 100 - not changeable

    await db.commit()
    await db.refresh(category)

    return category


# ============================================
# 9. DELETE CUSTOM CATEGORY
# ============================================
@router.delete("/custom/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_custom_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a user's custom category"""

    # Find category and verify ownership
    query = select(CategoryRule).where(
        CategoryRule.id == category_id, CategoryRule.user_id == current_user.id
    )
    result = await db.execute(query)
    category = result.scalars().first()

    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom category not found or you don't have permission to delete it",
        )

    # Prevent deleting system defaults
    if category.is_default:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete system default categories",
        )

    await db.delete(category)
    await db.commit()

    return None
