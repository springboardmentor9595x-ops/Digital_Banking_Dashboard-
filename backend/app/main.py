from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from .database import Base, engine
from . import models 
from .auth_routes import router as auth_router
from .accounts_routes import router as accounts_router
from .transactions_routes import router as transactions_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(transactions_router)

@app.get("/")
def home():
    return {"message": "Banking API working!"}
