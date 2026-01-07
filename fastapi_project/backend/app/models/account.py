from sqlalchemy import Column, Integer, String, Float, ForeignKey
from app.database import Base

class Account(Base):
    __tablename__ = "accounts"   # ✅ FIXED

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    balance = Column(Float, default=0.0)
    currency = Column(String, default="INR")
