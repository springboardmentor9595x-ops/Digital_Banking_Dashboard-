# from fastapi import APIRouter, Depends, UploadFile, File
# from sqlalchemy.orm import Session
# from ..database import get_db
# from ..deps import get_current_user
# import os, uuid

# router = APIRouter(prefix="/profile", tags=["Profile"])

# UPLOAD_DIR = "uploads"
# os.makedirs(UPLOAD_DIR, exist_ok=True)

# @router.post("/upload-photo")
# def upload_photo(
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db),
#     current_user = Depends(get_current_user)
# ):
#     filename = f"{uuid.uuid4()}_{file.filename}"
#     path = os.path.join(UPLOAD_DIR, filename)

#     with open(path, "wb") as f:
#         f.write(file.file.read())

#     current_user.profile_image = path
#     db.commit()

#     return {"message": "Profile image uploaded", "image_url": path}


from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from ..database import get_db
from ..deps import get_current_user
import os, uuid 
from fastapi import HTTPException
from app.models import User
from app.security import verify_password, hash_password



router = APIRouter(prefix="/profile", tags=["Profile"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
def upload_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    filename = f"{uuid.uuid4()}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        f.write(file.file.read())

    current_user.profile_image = f"/uploads/{filename}"
    db.commit()

    return {"image_url": f"/uploads/{filename}"}


@router.put("/update-name")
def update_name(
    new_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not new_name:
        raise HTTPException(status_code=400, detail="Name required")

    current_user.name = new_name
    db.commit()
    db.refresh(current_user)

    return {"message": "Name updated successfully"}


@router.put("/update-password")
def update_password(
    current_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # check current password
    if not verify_password(current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Wrong current password")

    # hash new password
    hashed_new_password = hash_password(new_password)


    current_user.password = hashed_new_password
    db.commit()

    return {"message": "Password updated successfully"}
