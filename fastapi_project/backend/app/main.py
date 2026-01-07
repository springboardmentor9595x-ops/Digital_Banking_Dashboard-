from app.routes import accounts
from fastapi import FastAPI
from app.database import engine, Base
from app.routes import auth
from app.models import user, account  # 👈 IMPORTANT

app = FastAPI()

# 🔥 CREATE TABLES
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(accounts.router)
