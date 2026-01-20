from sqlalchemy import Integer, String, Numeric, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base
from decimal import Decimal
class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    bank_name: Mapped[str] = mapped_column(String, nullable=False)

    account_type: Mapped[str] = mapped_column(String, nullable=False)

    masked_account: Mapped[str] = mapped_column(String, nullable=False)

    currency: Mapped[str] = mapped_column(String(3), nullable=False)

    balance: Mapped[Decimal] = mapped_column(
    Numeric(12, 2),
    nullable=False,
    default=Decimal("0.00")
)

    created_at: Mapped[str] = mapped_column(
        TIMESTAMP,
        server_default=func.now()
    )
