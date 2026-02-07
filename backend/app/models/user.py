from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.base_class import Base



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # existing relationship (DO NOT REMOVE)
    accounts = relationship(
        "Account",
        back_populates="owner",
        cascade="all, delete"
    )

    # ✅ ADD THESE (FIXES YOUR ERROR)
    budgets = relationship(
        "Budget",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    bills = relationship(
        "Bill",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    category_rules = relationship(
        "CategoryRule",
        back_populates="user",
        cascade="all, delete-orphan"
    )
