from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from typing import AsyncGenerator
import os
from dotenv import load_dotenv
import uvicorn
from sqlalchemy import create_engine as sync_create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL not found in environment variables. Check your .env uvi"
    )


if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
elif DATABASE_URL.startswith("postgresql://") and "+asyncpg" not in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

print(f"Connecting to: {DATABASE_URL}")

engine = create_async_engine(DATABASE_URL, echo=True, pool_size=10, max_overflow=10)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        # Just verify connection works
        result = await conn.execute(text("SELECT 1"))
        print("Database connection successful!")


async def dispose_db():
    await engine.dispose()
    print("Database connections closed!")


# ============================================
# SYNCHRONOUS SESSION FOR CELERY
# ============================================


# Remove +asyncpg for sync connection
SYNC_DATABASE_URL = DATABASE_URL.replace("+asyncpg", "")

# Create sync engine for Celery
sync_engine = sync_create_engine(SYNC_DATABASE_URL, echo=False)

# Create sync session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=sync_engine)


def get_sync_db():
    """Get synchronous database session for Celery tasks"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
