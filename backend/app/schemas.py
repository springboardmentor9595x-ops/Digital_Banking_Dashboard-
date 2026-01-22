from datetime import date
from pydantic import BaseModel


class BillCreate(BaseModel):
    biller_name: str
    amount_due: float
    due_date: date


class BillOut(BaseModel):
    id: int
    biller_name: str
    amount_due: float
    due_date: date
    status: str

    class Config:
        from_attributes = True
