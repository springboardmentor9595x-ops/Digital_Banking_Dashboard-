from fastapi import FastAPI
from app.database import engine, Base
from app.routes import auth
from app.models import user   # 👈 IMPORTANT

app = FastAPI()

# 🔥 CREATE TABLES
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
