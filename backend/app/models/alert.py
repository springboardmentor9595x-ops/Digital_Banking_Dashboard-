from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base_class import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    alert_type = Column(String, nullable=False)
    message = Column(String, nullable=False)
    read_status = Column(Boolean, default=False)

    # ✅ FIXED — func imported properly
    created_at = Column(DateTime, server_default=func.now())
