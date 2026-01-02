from fastapi import FastAPI
from app.db.database import engine
from sqlalchemy import text

app=FastAPI(title="Modern Digital Banking API")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/db-check")
def db_check():
    try:
        with engine.connect() as conn:
            res=conn.execute(text("SELECT 1"))
            return {
                "db_status": "connected",
                "result": res.scalar()
            }
    except Exception as e:
        return {
            "db_status": "error",
            "details": str(e)
        }