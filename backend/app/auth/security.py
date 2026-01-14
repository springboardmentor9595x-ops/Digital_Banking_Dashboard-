from datetime import timedelta
from fastapi.security import OAuth2PasswordBearer

SECRET_KEY = "SECRET123"      # keep same everywhere
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
