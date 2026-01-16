from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP
from sqlalchemy.sql import func
import enum

from app.db.base import Base


class KYCStatus(enum.Enum):
    unverified = "unverified"
    verified = "verified"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    kyc_status = Column(Enum(KYCStatus), default=KYCStatus.unverified)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
