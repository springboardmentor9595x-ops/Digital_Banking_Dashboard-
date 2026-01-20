from sqlalchemy import Integer, String, TIMESTAMP, Numeric, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column
from app.db.database import Base
from decimal import Decimal
from typing import Optional

class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    account_id: Mapped[int] = mapped_column(ForeignKey("accounts.id"), nullable=False)

    description: Mapped[str] = mapped_column(String, nullable=False)
    
    category: Mapped[str] = mapped_column(String, nullable=False)

    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    
    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    txn_type: Mapped[str] = mapped_column(String, nullable=False)
    
    merchant: Mapped[Optional[str]] = mapped_column(String)

    txn_date: Mapped[str] = mapped_column(
        TIMESTAMP,
        server_default=func.now(),
        nullable=False
    )

    posted_date: Mapped[str] = mapped_column(
        TIMESTAMP,
        server_default=func.now(),
        nullable=False
    )

    # created_at: Mapped[str] = mapped_column(
    #     TIMESTAMP,
    #     server_default=func.now()
    # )
