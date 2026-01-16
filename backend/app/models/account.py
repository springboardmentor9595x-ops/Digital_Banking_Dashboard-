from sqlalchemy import Column, Integer, String, Enum, ForeignKey, TIMESTAMP, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class AccountType(enum.Enum):
    savings = "savings"
    checking = "checking"
    credit_card = "credit_card"
    loan = "loan"
    investment = "investment"


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    bank_name = Column(String, nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    masked_account = Column(String, nullable=False)
    currency = Column(String(3), default="INR")
    balance = Column(Numeric(12, 2), default=0)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    user = relationship("User", backref="accounts")
