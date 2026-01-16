from sqlalchemy import Column, Integer, String, Enum, ForeignKey, TIMESTAMP, Numeric
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class TransactionType(enum.Enum):
    debit = "debit"
    credit = "credit"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)

    description = Column(String, nullable=False)
    category = Column(String, nullable=True)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR")

    txn_type = Column(Enum(TransactionType), nullable=False)
    merchant = Column(String, nullable=True)

    txn_date = Column(TIMESTAMP, nullable=False)
    posted_date = Column(TIMESTAMP, nullable=True)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    account = relationship("Account", backref="transactions")
