from pydantic import BaseModel


class TransactionCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: float


class TransactionResponse(BaseModel):
    id: int
    from_account_id: int
    to_account_id: int
    amount: float
    currency: str
    status: str

    class Config:
        from_attributes = True
