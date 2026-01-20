from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine

from app.models.user import User
from app.models.account import Account

from sqlalchemy import text
# from app.core.config import APP_NAME, DB_NAME
from app.routes import auth
from app.routes import accounts
from app.routes import transactions

app=FastAPI(title="Modern Digital Banking API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",      # Old vanilla JS frontend
        "http://localhost:5500",       # Old vanilla JS frontend
        "http://127.0.0.1:5173",      # ← ADD: React/Vite dev server
        "http://localhost:5173",       # ← ADD: React/Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(transactions.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/db-check")
def db_check():
    try:
        with engine.connect() as conn:
            res=conn.execute(text("SELECT 1"))
            return {
                "db_status": "connected",
                "result": res.scalar()
            }
    except Exception as e:
        return {
            "db_status": "error",
            "details": str(e)
        }
        
# @app.get("/env-check")
# def env_check():
#     return {
#         "app_name": APP_NAME,
#         "db_name": DB_NAME
#     }
    
    