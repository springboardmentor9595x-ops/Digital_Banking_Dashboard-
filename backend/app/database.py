from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

DATABASE_URL = "postgresql://postgres:sujitha123@localhost/banking_dashboard"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ---- ADD THIS PART ----
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
# -----------------------
