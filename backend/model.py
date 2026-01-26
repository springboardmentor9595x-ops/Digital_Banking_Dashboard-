from sqlalchemy import (
Column,
Integer,
String,
Numeric,
Boolean,
DateTime,
Date,
Text,
ForeignKey,
Enum,
)
from sqlalchemy import DateTime
from datetime import timezone
from sqlalchemy.schema import UniqueConstraint
from sqlalchemy.sql import func
from .database import Base
import enum



class KYCStatus(enum.Enum):
    """KYC verification status"""
    unverified = "unverified"
    verified = "verified"

class UserRole(enum.Enum):  
    user = "user"
    admin = "admin"

class AccountType(enum.Enum):
    """Bank account types"""
    savings = "savings"
    checking = "checking"
    credit_card = "credit_card"
    loan = "loan"
    investment = "investment"

class TransactionType(enum.Enum):
    """Transaction types"""
    debit = "debit"
    credit = "credit"

class BillStatus(enum.Enum):
    """Bill payment status"""
    upcoming = "upcoming"
    paid = "paid"
    overdue = "overdue"

class AlertType(enum.Enum):
    """Alert notification types"""
    low_balance = "low_balance"
    bill_due = "bill_due"
    budget_exceeded = "budget_exceeded"


# ============================================
# MODELS
# ============================================
class User(Base):
    """User model - stores user account information"""
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    kyc_status = Column(
    Enum(KYCStatus, name="kyc_status_enum"),         # ← Specify exact name
    default=KYCStatus.unverified,
    )
    role = Column( Enum(UserRole, name="user_role_enum"), default=UserRole.user, )           # ← Specify exact name
    created_at = Column(DateTime, server_default=func.now())


class Account(Base):
    """Account model - stores bank accounts"""

    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    bank_name = Column(String(100), nullable=False)
    account_type = Column(
        Enum(AccountType, name="account_type_enum"),  # ← Specify exact name
        nullable=False,
    )
    masked_account = Column(String(20), nullable=True)
    currency = Column(String(3), default="INR")
    balance = Column(Numeric(14, 2), default=0.0)
    created_at = Column(DateTime, server_default=func.now())


class Transaction(Base):
    """Transaction model - stores financial transactions"""

    __tablename__ = "transactions"
    __table_args__ = (
        UniqueConstraint(
            "account_id",
            "amount",
            "txn_type",
            "merchant",
            "txn_date",
            name="unique_transaction_per_day",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    account_id = Column(
        Integer, ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False
    )
    description = Column(String(100), nullable=True)
    category = Column(String(50), nullable=True)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(3), default="INR")
    txn_type = Column(
        Enum(TransactionType, name="txn_type_enum"),  # ← Specify exact name
        nullable=False,
    )
    merchant = Column(String(50), nullable=True)
    txn_date = Column(DateTime, nullable=False)
    posted_date = Column(DateTime(timezone=True))


class Budget(Base):
    """Budget model - stores monthly budgets"""

    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    month = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True)
    category = Column(String(50), nullable=True)
    limit_amount = Column(Numeric(14, 2), nullable=True)
    spent_amount = Column(Numeric(14, 2), default=0.0)
    created_at = Column(DateTime, server_default=func.now())


class Bill(Base):
    """Bill model - stores upcoming bills"""

    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    biller_name = Column(String(50), nullable=True)
    due_date = Column(Date, nullable=True)
    amount_due = Column(Numeric(14, 2), nullable=True)
    status = Column(
        Enum(BillStatus, name="status_enum"),  # ← Specify exact name
        default=BillStatus.upcoming,
    )
    auto_pay = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())


class Reward(Base):
    """Reward model - stores loyalty points"""

    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    program_name = Column(String(50), nullable=True)
    points_balance = Column(Integer, default=0)
    last_updated = Column(DateTime, server_default=func.now())


class Alert(Base):
    """Alert model - stores user notifications"""

    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    alert_type = Column(
        Enum(AlertType, name="type_enum"), nullable=True  # ← Specify exact name
    )
    message = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class AdminLog(Base):
    """AdminLog model - stores admin actions"""

    __tablename__ = "adminlogs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(Text, nullable=True)
    target_type = Column(String(50), nullable=True)
    target_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
