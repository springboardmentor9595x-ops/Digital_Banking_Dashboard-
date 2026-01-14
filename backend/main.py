from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import Base, engine

from app.routes.auth import router as auth_router
from app.routes.account import router as account_router
from app.routes.transaction import router as transaction_router

app = FastAPI()

# ✅ CORS FIX (NO LOGIC CHANGE)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(account_router)
app.include_router(transaction_router)
