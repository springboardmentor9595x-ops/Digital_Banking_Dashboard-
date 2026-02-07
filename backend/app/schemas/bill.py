from datetime import date
from pydantic import BaseModel
from typing import Optional


# ------------------------
# CREATE BILL
# ------------------------
class BillCreate(BaseModel):
    biller_name: str
    amount_due: float
    due_date: date
    auto_pay: bool = False


# ------------------------
# UPDATE BILL
# ------------------------
class BillUpdate(BaseModel):
    biller_name: Optional[str] = None
    amount_due: Optional[float] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    auto_pay: Optional[bool] = None


# ------------------------
# RESPONSE MODEL
# ------------------------
class BillOut(BaseModel):
    id: int
    biller_name: str
    amount_due: float
    due_date: date
    status: str
    auto_pay: bool

    class Config:
        from_attributes = True
