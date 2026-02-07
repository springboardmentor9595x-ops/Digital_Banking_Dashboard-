from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base_class import Base  # ✅ USE SINGLE BASE

# ✅ CORRECT SQLite DB FILE
DATABASE_URL = "sqlite:///./bank.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# ✅ Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
