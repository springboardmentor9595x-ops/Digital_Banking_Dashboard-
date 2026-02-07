from sqlalchemy import Column, Integer, String, Float, Date, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)

    # 🔗 Link bill to logged-in user
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    biller_name = Column(String, nullable=False)
    amount_due = Column(Float, nullable=False)
    due_date = Column(Date, nullable=False)

    # upcoming / paid / overdue
    status = Column(String, default="upcoming", nullable=False)

    auto_pay = Column(Boolean, default=False)

    # 🔔 Reminder flag (prevents duplicate reminders)
    reminder_sent = Column(Boolean, default=False)

    # ✅ Relationship
    user = relationship("User", back_populates="bills")
