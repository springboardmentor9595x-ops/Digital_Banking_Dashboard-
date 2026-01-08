from fastapi import FastAPI
from app.routes.auth import router as auth_router
from app.routes.account import router as account_router
from app.db.database import Base, engine

app = FastAPI()

# 🔥 CREATE DATABASE TABLES
Base.metadata.create_all(bind=engine)

# 🔐 Auth routes
app.include_router(auth_router)

# 💳 Account routes
app.include_router(account_router)
