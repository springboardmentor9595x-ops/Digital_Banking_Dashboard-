from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from model import UserRole  # NEW IMPORT


class UserRegister(BaseModel):
    """Schema for user registration request"""

    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    phone: Optional[str] = Field(None, max_length=20)
    role: Optional[UserRole] = Field(UserRole.user)  # NEW FIELD - defaults to 'user'


class UserLogin(BaseModel):
    """Schema for login request"""

    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for token response"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Schema for user data in responses (excludes password)"""

    id: int
    name: str
    email: str
    phone: Optional[str]
    kyc_status: str
    role: str  # NEW FIELD
    created_at: datetime


class Config:
    from_attributes = True
