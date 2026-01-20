from contextlib import asynccontextmanager
from fastapi import FastAPI
import logging
from fastapi.middleware.cors import CORSMiddleware

from database import init_db, get_db, dispose_db
import model
from routes import auth
from routes.accounts import (
    router as accounts_router,
)  # NEW LINE: Import accounts router
from routes.transactions import router as transactions_router
from routes.dashboard import router as dashboard_router

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
        logger.error(f" Database connection failed: {str(e)}")
        raise
    yield
    logger.info("shutting down")
    try:
        await dispose_db()
        logger.info(" Database connections closed")
    except Exception as e:
        logger.error(f"Error during shutdown: {str(e)}")


app = FastAPI(
    title="Banking Dashboard API",
    description="Banking Dashboard backend",
    version="1.0.0",
    lifespan=Lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",  # Alternative localhost
        "http://localhost:3000",  # Just in case you switch ports
    ],
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "DELETE",
        "OPTIONS",
    ],  # Explicitly list OPTIONS
    allow_headers=["*"],
    expose_headers=["*"],
)


app.include_router(auth.router)
app.include_router(accounts_router)  # NEW LINE: Register accounts router
app.include_router(transactions_router)  # NEW LINE: Register transactions router
app.include_router(dashboard_router)


@app.get("/")
async def root():
    return {"message": "Banking Dashboard API", "status": "running", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
