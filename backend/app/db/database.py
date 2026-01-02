from sqlalchemy import create_engine

DATABASE_URL = "postgresql://postgres:Samyo1234@localhost:5432/digital_banking"

engine=create_engine(DATABASE_URL)

def test_conn():
    try:
        with engine.connect() as conn:
            print("Database connection successful")
    except Exception as e:
        print("Database connection failed", e)
        