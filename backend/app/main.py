from fastapi import FastAPI
from app.db.database import engine
from sqlalchemy import text
# from app.core.config import APP_NAME, DB_NAME
from app.routes import auth

app=FastAPI(title="Modern Digital Banking API")

app.include_router(auth.router)

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
        
# @app.get("/env-check")
# def env_check():
#     return {
#         "app_name": APP_NAME,
#         "db_name": DB_NAME
#     }
    
    