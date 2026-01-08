from fastapi import FastAPI

from app.config.database import Base, engine
from app.routes.account import router as account_router

app = FastAPI()

# create tables
Base.metadata.create_all(bind=engine)

# include routes
app.include_router(account_router)
