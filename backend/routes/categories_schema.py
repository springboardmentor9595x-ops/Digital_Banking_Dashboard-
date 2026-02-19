"""
Pydantic schemas for category-related endpoints
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class CategoryResponse(BaseModel):
    """Response schema for a single category"""

    id: int
    user_id: Optional[int]
    category_name: str
    keywords: Optional[List[str]]
    merchants: Optional[List[str]]
    is_default: bool
    priority: int

    class Config:
        from_attributes = True


class CategoryListResponse(BaseModel):
    """Response schema for list of category names"""

    categories: List[str]


class CategorizationPreviewRequest(BaseModel):
    """Request schema for testing categorization"""

    merchant: Optional[str] = None
    description: Optional[str] = None


class CustomCategoryCreateRequest(BaseModel):
    """Request schema for creating a custom category"""

    category_name: str = Field(..., min_length=2, max_length=50)
    keywords: Optional[List[str]] = Field(
        default_factory=list, description="Keywords to match in description"
    )
    merchants: Optional[List[str]] = Field(
        default_factory=list, description="Merchant names to match"
    )
    # ✅ REMOVED: priority field - backend will auto-set to 100


class CustomCategoryUpdateRequest(BaseModel):
    """Request schema for updating a custom category"""

    category_name: Optional[str] = Field(None, min_length=2, max_length=50)
    keywords: Optional[List[str]] = None
    merchants: Optional[List[str]] = None
    # ✅ REMOVED: priority field - cannot be changed
