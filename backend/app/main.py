from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.account import router as account_router
from app.routes import transaction
from app.db.database import Base, engine

app = FastAPI()

# ✅ ADD CORS (THIS FIXES YOUR FRONTEND ISSUE)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow frontend (file://, browser)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Routes
app.include_router(auth_router)
app.include_router(account_router)
app.include_router(transaction.router)
