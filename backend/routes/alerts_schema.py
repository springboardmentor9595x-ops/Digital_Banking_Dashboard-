from pydantic import BaseModel
from datetime import datetime


class AlertResponse(BaseModel):
    id: int
    user_id: int
    alert_type: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True
