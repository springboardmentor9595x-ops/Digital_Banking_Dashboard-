from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "mysecretkey"   # later move to .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    if __name__ == "__main__":
        token = create_access_token({"sub": "test@example.com"})
        print("Generated Token:", token)
