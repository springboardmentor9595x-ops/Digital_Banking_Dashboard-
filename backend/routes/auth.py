from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db
from model import User
from auth.schemas import UserRegister, UserLogin, Token, UserResponse
from auth.password_handler import hash_password, verify_password
from auth.jwt_handler import (
    create_access_token,
    get_current_user,
    get_current_admin,
    create_refresh_token,
    verify_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


class UserProfileResponse(BaseModel):
    """Response model for user profile"""

    id: int
    name: str
    email: str
    phone: Optional[str]
    kyc_status: str
    role: str
    created_at: str

    class Config:
        from_attributes = True


class UpdateProfileRequest(BaseModel):
    """Request to update name and phone"""

    name: str
    phone: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    """Request to change password"""

    current_password: str
    new_password: str


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalars().first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )
    hashed_password = hash_password(user_data.password)

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        phone=user_data.phone,
        role=user_data.role,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
async def refresh_access_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    payload = verify_token(refresh_token, token_type="refresh")
    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    # Verify user still exists
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    # Create new tokens
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }


@router.get("/admin/users", response_model=list[UserResponse])
async def get_all_users(
    current_admin: User = Depends(get_current_admin), db: AsyncSession = Depends(get_db)
):
    """Admin-only endpoint to retrieve all users"""
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users


# ============================================
# PROFILE MANAGEMENT ENDPOINTS
# ============================================


@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Get current user's profile information

    Returns:
        - id: User ID
        - name: Username
        - email: Email (read-only)
        - phone: Phone number
        - kyc_status: KYC verification status (read-only)
        - role: User role
        - created_at: Account creation date
    """
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "phone": current_user.phone,
        "kyc_status": current_user.kyc_status,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat(),
    }


@router.patch("/profile")
async def update_profile(
    profile_data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update user profile (name and phone only)

    Email and KYC status cannot be changed

    Args:
        - name: New username (3-100 characters)
        - phone: New phone number (10 digits)
    """

    # Validate phone number if provided
    if profile_data.phone:
        if not profile_data.phone.isdigit() or len(profile_data.phone) != 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number must be exactly 10 digits",
            )

    # Validate name length
    if len(profile_data.name.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name must be at least 3 characters long",
        )

    # Check if name is already taken by another user (ASYNC VERSION)
    if profile_data.name != current_user.name:
        result = await db.execute(  # ← ADD await
            select(User).where(
                User.name == profile_data.name, User.id != current_user.id
            )
        )
        existing_user = result.scalars().first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken"
            )

    # Update user
    current_user.name = profile_data.name.strip()
    current_user.phone = profile_data.phone

    await db.commit()  # ← ADD await
    await db.refresh(current_user)  # ← ADD await

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "kyc_status": current_user.kyc_status,
        },
    }


@router.patch("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change user password

    Args:
        - current_password: Current password for verification
        - new_password: New password (minimum 8 characters)
    """

    # Verify current password
    if not verify_password(password_data.current_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Validate new password length
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters long",
        )

    # Check if new password is same as current
    if verify_password(password_data.new_password, current_user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as current password",
        )

    # Update password
    current_user.password = hash_password(password_data.new_password)
    await db.commit()  # ← ADD await

    return {"message": "Password changed successfully"}
