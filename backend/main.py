from contextlib import asynccontextmanager
from fastapi import FastAPI
import logging
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_db, dispose_db
import model
from routes import auth
from routes.accounts import router as accounts_router
from routes.transactions import router as transactions_router
from routes.dashboard import router as dashboard_router
from routes.categories import router as categories_router
from routes.budgets import router as budgets_router
from routes.bills import router as bills_router
from routes.alerts import router as alerts_router
from routes import rewards
from routes import insights
from routes import reports

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s-%(name)s-%(levelname)s-%(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def Lifespan(app: FastAPI):
    logger.info("starting up")
    try:
        await init_db()
        logger.info("Database connected")
    except Exception as e:
        logger.error(f"Database connection failed: {str(e)}")
        raise
    yield
    logger.info("shutting down")
    try:
        await dispose_db()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")


app = FastAPI(
    title="Banking Dashboard API",
    description="Banking Dashboard backend",
    version="1.0.0",
    lifespan=Lifespan,
)

# ✅ FIXED CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],  # ✅ CHANGED: Allow all methods
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # ✅ ADDED: Cache preflight for 1 hour
)

app.include_router(auth.router)
app.include_router(accounts_router)
app.include_router(transactions_router)
app.include_router(dashboard_router)
app.include_router(categories_router)
app.include_router(budgets_router)
app.include_router(bills_router)
app.include_router(alerts_router)
app.include_router(rewards.router)
app.include_router(insights.router)
app.include_router(reports.router)


@app.get("/")
async def root():
    return {"message": "Banking Dashboard API", "status": "running", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
