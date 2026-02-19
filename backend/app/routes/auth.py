from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,   # ✅ ADD THIS
)

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

# =========================
# REGISTER
# =========================
@router.post("/register", status_code=201)
def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = User(
        email=user.email,
        hashed_password=hash_password(user.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}


# =========================
# LOGIN (OAuth2 Password Flow)
# =========================
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    # 🔑 OAuth2 standard: username field contains email
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # ✅ user_id stored in token (matches get_current_user)
    access_token = create_access_token(
        data={"user_id": user.id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
# =========================
# GET CURRENT USER (PROFILE)
# =========================
@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email
    }
# =========================
# CHANGE PASSWORD
# =========================
@router.post("/change-password")
def change_password(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        raise HTTPException(
            status_code=400,
            detail="Old password and new password are required"
        )

    # 🔐 verify current password
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=400,
            detail="Incorrect current password"
        )

    # 🔐 update password
    current_user.hashed_password = hash_password(new_password)
    db.commit()

    return {"message": "Password updated successfully"}
