from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.account import router as account_router
from app.routes.transaction import router as transaction_router
from app.routes.bills import router as bills_router
from app.routes.budgets import router as budgets_router
from app.routes.transfer import router as transfer_router
from app.routes.category_rule import router as categories_router
from app.routes.reward import router as reward_router
from app.routes.insights import router as insights_router
from app.routes.alerts import router as alerts_router

from app.db.database import engine
from app.db.base_class import Base

# ✅ ADD THIS LINE (VERY IMPORTANT)
from app.models.alert import Alert


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ This will now also create alerts table
Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(account_router)
app.include_router(transaction_router)
app.include_router(bills_router)
app.include_router(budgets_router)
app.include_router(transfer_router)
app.include_router(categories_router)
app.include_router(reward_router)
app.include_router(insights_router)
app.include_router(alerts_router)
