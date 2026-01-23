from pydantic import BaseModel

class BudgetCreate(BaseModel):
    month: int
    year: int
    category: str
    limit_amount: float


class BudgetOut(BudgetCreate):
    id: int

    class Config:
        from_attributes = True
