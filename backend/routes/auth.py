from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..auth.schemas import UserRegister, UserLogin, Token, UserResponse
from ..auth.password_handler import hash_password, verify_password
from ..auth.jwt_handler import create_access_token, get_current_user, get_current_admin
from ..model import User
from ..database import get_db


router = APIRouter(prefix="/auth", tags=["Authentication"])
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.
    By default creates a regular user. Only admins can create other admins.
    """
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalars().first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    # Hash password and create user
    hashed_pw = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_pw,
        phone=user_data.phone,
        role=user_data.role  # UPDATED - now includes role
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Login endpoint - returns JWT access token. 
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == credentials.email))
    user = result.scalars().first()
    # Verify user exists and password is correct
    if not user or not verify_password(credentials.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    # Create access token
    access_token = create_access_token(data={"sub": str(user.id)})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's information.
    """
    return current_user
@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user's profile information.
    """
    return current_user


# NEW ENDPOINT - Admin only
@router.get("/admin/users", response_model=list[UserResponse])
async def get_all_users(
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin-only endpoint to retrieve all users.
    """
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users