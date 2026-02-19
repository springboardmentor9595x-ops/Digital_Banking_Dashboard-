from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.database import Base, engine

from app.routes.auth import router as auth_router
from app.routes.account import router as account_router
from app.routes.transaction import router as transaction_router
from app.routes.transfer import router as transfer_router  # ✅ FIXED
from app.routes import insights
from app.routes import alerts
app = FastAPI()

# ✅ CORS (unchanged)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all origins INCLUDING file://
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# ✅ ROUTERS (unchanged order)
app.include_router(auth_router)
app.include_router(account_router)
app.include_router(transaction_router)
app.include_router(transfer_router)  # ✅ FIXED
app.include_router(insights.router)
app.include_router(alerts.router)