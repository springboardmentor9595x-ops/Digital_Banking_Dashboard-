from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.deps import get_current_user
from app.models import Reward, User
from app.utils.currency_converter import convert_amount
from app.schemas.reward import RewardCreate, RewardUpdate
from decimal import Decimal
from app.utils.currency_converter import convert_amount
from app.utils.exchange_rates import get_exchange_rates
from datetime import datetime
router = APIRouter(prefix="/rewards", tags=["Rewards"])
@router.post("/")
def create_reward(
    data: RewardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reward = Reward(
    program_name=data.program_name,
    user_id=current_user.id,
    points_balance=Decimal("0.0")
)

    db.add(reward)
    db.commit()
    db.refresh(reward)

    return {"message": "Reward program created"}

@router.put("/points")
def update_reward_points(
    data: RewardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reward = db.query(Reward).filter(
        Reward.id == data.reward_id,
        Reward.user_id == current_user.id
    ).first()

    if not reward:
        raise HTTPException(status_code=403, detail="Unauthorized access")

    # ✅ Update points
    reward.points_balance += Decimal(str(data.points))

    # ✅ Conversion rate (example: 1 point = 0.01 currency)
    conversion_rate = Decimal("0.01")

    # ✅ Update value
    reward.value = reward.points_balance * conversion_rate

    # ✅ Update timestamp
    reward.last_updated = datetime.utcnow()

    db.commit()
    db.refresh(reward)

    return {
        "message": "Reward points updated",
        "points_balance": float(reward.points_balance),
        "value": float(reward.value),   # <-- IMPORTANT
        "last_updated": reward.last_updated
    }
@router.get("/")
def list_rewards(
    currency: str = "INR",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rates = get_exchange_rates()

    if currency not in rates:
        raise HTTPException(
            status_code=400,
            detail="Unsupported currency"
        )

    rewards = db.query(Reward).filter(
        Reward.user_id == current_user.id
    ).all()

    response = []

    for reward in rewards:
        points = float(reward.points_balance)

        # 1 point = ₹0.01
        value_in_inr = points / 100

        converted_value = convert_amount(
            value_in_inr, "INR", currency
        )

        response.append({
            "id": reward.id,
            "program_name": reward.program_name,
            "points_balance": points,
            "value_in_inr": round(value_in_inr, 2),
            "converted_value": round(converted_value, 2),
            "currency": currency,
            "last_updated": reward.last_updated
        })

    return response
@router.delete("/{reward_id}")
def delete_reward(
    reward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reward = db.query(Reward).filter(
        Reward.id == reward_id,
        Reward.user_id == current_user.id
    ).first()

    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    db.delete(reward)
    db.commit()

    return {"message": "Reward deleted successfully"}
