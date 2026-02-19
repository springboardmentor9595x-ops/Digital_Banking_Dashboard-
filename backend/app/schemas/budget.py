from pydantic import BaseModel

class BudgetCreate(BaseModel):
    month: int
    year: int
    category: str
    limit_amount: float


class BudgetOut(BaseModel):
    id: int
    category: str
    limit: float
    spent: float
    remaining: float
    over_budget: bool

    model_config = {
        "from_attributes": True
}

