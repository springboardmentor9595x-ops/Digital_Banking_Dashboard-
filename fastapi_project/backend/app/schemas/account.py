from pydantic import BaseModel

class AccountCreate(BaseModel):
    name: str
    balance: float
    currency: str

class AccountResponse(BaseModel):
    id: int
    name: str
    balance: float
    currency: str
    user_id: int

    class Config:
        from_attributes = True
