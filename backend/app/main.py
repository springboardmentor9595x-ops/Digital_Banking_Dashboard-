from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.session import engine
from app.db.base import Base
from app.routes import auth

app = FastAPI()

# ✅ CORS CONFIG (THIS FIXES OPTIONS 405)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite frontend
    allow_credentials=True,
    allow_methods=["*"],  # allows OPTIONS, POST, GET
    allow_headers=["*"],
)

# create tables
Base.metadata.create_all(bind=engine)

# routes
app.include_router(auth.router)


@app.get("/")
def root():
    return {"status": "FastAPI backend running 🚀"}
