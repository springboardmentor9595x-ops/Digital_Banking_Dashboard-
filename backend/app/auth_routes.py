from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from . import models
from .database import get_db
from .security import hash_password, verify_password
from .jwt_utils import create_access_token, create_refresh_token

router = APIRouter(prefix="/auth", tags=["Auth"])


# ----------- Request Schemas -----------
class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


# ----------- Register -----------
@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == data.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        name=data.name,
        email=data.email,
        password=hash_password(data.password)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "User registered successfully"}

# ----------- Login -----------
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(models.User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access = create_access_token({"sub": user.email})
    refresh = create_refresh_token({"sub": user.email})

    return {
        "access_token": access,
        "refresh_token": refresh
    }


# ----------- Refresh Token -----------
@router.post("/refresh")
def refresh_token(refresh_token: str):
    from jose import jwt, ExpiredSignatureError, JWTError

    try:
        payload = jwt.decode(refresh_token, "supersecretkey", algorithms=["HS256"])
        email = payload.get("sub")
        new_access = create_access_token({"sub": email})
        return {"access_token": new_access}

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

