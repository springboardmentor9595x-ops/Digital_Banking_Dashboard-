# from sqlalchemy import Column, Integer, String, Enum
# from .database import Base

# class User(Base):
#     __tablename__ = "users"

#     id = Column(Integer, primary_key=True, index=True)
#     name = Column(String, nullable=False)
#     email = Column(String, unique=True, index=True, nullable=False)
#     password = Column(String, nullable=False)

from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    phone = Column(String, nullable=True)
    kyc_status = Column(String, default="unverified")
    created_at = Column(TIMESTAMP, server_default=func.now())


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