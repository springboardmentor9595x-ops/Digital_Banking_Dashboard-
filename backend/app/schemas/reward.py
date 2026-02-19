from pydantic import BaseModel
from datetime import datetime

class RewardCreate(BaseModel):
    program_name: str
    points_balance: int = 0

class RewardUpdate(BaseModel):
    points_balance: int

class RewardOut(BaseModel):
    id: int
    program_name: str
    points_balance: int
    last_updated: datetime

    model_config = {
        "from_attributes": True
}

