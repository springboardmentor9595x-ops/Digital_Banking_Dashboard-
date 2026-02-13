from pydantic import BaseModel

class RewardCreate(BaseModel):
    program_name: str
class RewardUpdate(BaseModel):
    reward_id: int
    points: float