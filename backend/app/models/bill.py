from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.db.database import Base


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    biller_name = Column(String)
    amount_due = Column(Float)
    due_date = Column(Date)
    status = Column(String)
