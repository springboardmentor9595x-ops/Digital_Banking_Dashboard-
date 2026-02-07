from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.reward import Reward
from app.schemas.reward import RewardCreate, RewardUpdate, RewardOut
from app.core.security import get_current_user
from app.models.user import User

# ✅ ADD THIS IMPORT (NEW)
from app.services.currency_service import convert_amount

router = APIRouter(prefix="/rewards", tags=["Rewards"])


# =========================
# 3️⃣ Create / Add Reward Program
# =========================
@router.post("/", response_model=RewardOut)
def create_reward(
    reward: RewardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_reward = Reward(
        program_name=reward.program_name,
        points_balance=reward.points_balance,
        user_id=current_user.id
    )
    db.add(new_reward)
    db.commit()
    db.refresh(new_reward)
    return new_reward


# =========================
# 4️⃣ Update Reward Points
# =========================
@router.put("/{reward_id}", response_model=RewardOut)
def update_reward_points(
    reward_id: int,
    reward_update: RewardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reward = db.query(Reward).filter(
        Reward.id == reward_id,
        Reward.user_id == current_user.id
    ).first()

    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    reward.points_balance = reward_update.points_balance
    db.commit()
    db.refresh(reward)
    return reward


# =========================
# 5️⃣ List Rewards for Logged-in User
# =========================
@router.get("/", response_model=List[RewardOut])
def list_rewards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rewards = db.query(Reward).filter(
        Reward.user_id == current_user.id
    ).all()
    return rewards


# =========================
# 🔄 6️⃣ Convert Reward Points to Currency (NEW)
# =========================
@router.get("/{reward_id}/convert")
def convert_reward_points(
    reward_id: int,
    to_currency: str = "INR",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    reward = db.query(Reward).filter(
        Reward.id == reward_id,
        Reward.user_id == current_user.id
    ).first()

    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")

    try:
        converted_value = convert_amount(
            amount=reward.points_balance,
            from_currency="INR",
            to_currency=to_currency
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Unsupported currency")

    return {
        "program_name": reward.program_name,
        "points": reward.points_balance,
        "currency": to_currency,
        "converted_value": converted_value
    }
