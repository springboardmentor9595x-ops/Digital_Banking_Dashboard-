from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.base_class import Base   # ✅ USE SINGLE BASE

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

# ✅ DB dependency (CORRECT)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
