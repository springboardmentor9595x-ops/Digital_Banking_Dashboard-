from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from .database import Base, engine
from . import models 
from .auth_routes import router as auth_router
from .accounts_routes import router as accounts_router
from .transactions_routes import router as transactions_router
from .routes import profile, alerts
from .routes import users
from .routes import category_rules
from .routes import budgets
from .routes import bills
from .routes import rewards
from .routes import insights
from .routes import reports
from fastapi.staticfiles import StaticFiles
import os
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(transactions_router)
app.include_router(profile.router)
app.include_router(alerts.router)
app.include_router(users.router)
app.include_router(category_rules.router)
app.include_router(budgets.router)
app.include_router(bills.router)
app.include_router(rewards.router)
app.include_router(insights.router)
app.include_router(reports.router)
@app.get("/")
def home():
    return {"message": "Banking API working!"}
