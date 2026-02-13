# from sqlalchemy import Column, Integer, String, Enum
# from .database import Base

# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, nullable=False)
#     email = Column(String, unique=True, index=True, nullable=False)
#     password = Column(String, nullable=False)

from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, TIMESTAMP, DateTime
from sqlalchemy.sql import func
from .database import Base
from datetime import datetime
from sqlalchemy import Boolean
from sqlalchemy.orm import relationship



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    phone = Column(String, nullable=True)
    kyc_status = Column(String, default="unverified")
    profile_image = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    bills = relationship("Bill", back_populates="user")
    rewards = relationship("Reward", back_populates="user", cascade="all, delete")

class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    bank_name = Column(String)
    account_type = Column(String)
    masked_account = Column(String)
    currency = Column(String(3))
    balance = Column(Numeric)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))
    account_id = Column(Integer, ForeignKey("accounts.id"))

    # income / expense / transfer
    type = Column(String, nullable=False)

    amount = Column(Numeric(12, 2), nullable=False)

    category = Column(String, nullable=True)
    description = Column(String, nullable=True)

    date = Column(TIMESTAMP, nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.now())

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    alert_type = Column(String)
    message = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_status = Column(Boolean, default=False)

class CategoryRule(Base):
    __tablename__ = "category_rules"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_name = Column(String, nullable=False)
    keywords = Column(String, nullable=False)  # comma separated
    created_at = Column(DateTime, default=datetime.utcnow)


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False)
    month = Column(Integer, nullable=False)   # 1–12
    year = Column(Integer, nullable=False)
    limit_amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    biller_name = Column(String, nullable=False)
    due_date = Column(DateTime, nullable=False)
    amount_due = Column(Numeric(10, 2), nullable=False)

    # upcoming / paid / overdue
    status = Column(String, default="upcoming")

    auto_pay = Column(Boolean, default=False)
    reminder_sent = Column(Boolean, default=False) 
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="bills")
    account_id = Column(Integer, ForeignKey("accounts.id"))



class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True)
    program_name = Column(String, nullable=False)
    points_balance = Column(Numeric(10, 2), default=0)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    last_updated = Column(DateTime, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="rewards")
