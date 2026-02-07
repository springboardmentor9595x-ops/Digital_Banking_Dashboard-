from sqlalchemy.orm import declarative_base

Base = declarative_base()

# 👇 IMPORT ALL MODELS HERE (VERY IMPORTANT)
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.bill import Bill   # ✅ ADD THIS LINE
