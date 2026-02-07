from sqlalchemy import Column, Integer, Float, String, ForeignKey, DateTime, Date
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.sql import func

from app.db.base_class import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    from_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    to_account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, nullable=False)
    status = Column(String, default="SUCCESS")
    description = Column(String, nullable=True)
    category = Column(String, nullable=True, default="Others")

    # ✅ ACTUAL transaction date (used by budgets)
    transaction_date = Column(Date, nullable=False)

    # 🔴 KEEP THESE (DO NOT TOUCH)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_on = Column(DateTime, server_default=func.now())

    from_account = relationship("Account", foreign_keys=[from_account_id])
    to_account = relationship("Account", foreign_keys=[to_account_id])
