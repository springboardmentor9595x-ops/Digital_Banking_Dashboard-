from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base



class CategoryRule(Base):
    __tablename__ = "category_rules"

    id = Column(Integer, primary_key=True, index=True)

    category_name = Column(String, nullable=False)
    keywords = Column(String, nullable=False)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # ✅ REQUIRED FOR SQLALCHEMY RELATIONSHIP
    user = relationship("User", back_populates="category_rules")
