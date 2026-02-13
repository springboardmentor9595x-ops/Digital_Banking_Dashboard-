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
