"""
Rewards Module Router
Handles loyalty reward programs and points tracking with currency conversion
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime

from auth.jwt_handler import get_current_user
from database import get_db
from model import User, Reward
from routes.rewards_schema import (
    RewardProgramCreate,
    RewardPointsUpdate,
    RewardResponse,
    RewardSummary,
)
from services.exchange_rate import ExchangeRateService

router = APIRouter(prefix="/rewards", tags=["Rewards"])


# ============================================
# 1. CREATE REWARD PROGRAM
# ============================================


@router.post("/", response_model=RewardResponse, status_code=status.HTTP_201_CREATED)
async def create_reward_program(
    payload: RewardProgramCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new reward program for the logged-in user.

    Example Request:
        POST /rewards/
        {
            "program_name": "HDFC Rewards",
            "points_balance": 5000
        }

    What happens:
    1. Check if program name already exists for this user
    2. Create new reward record in database
    3. Calculate points value in INR, USD, EUR
    4. Return reward with currency conversions
    """

    # Prevent duplicate program names
    existing_query = select(Reward).where(
        Reward.user_id == current_user.id,
        func.lower(Reward.program_name) == payload.program_name.lower(),
    )
    existing_result = await db.execute(existing_query)
    existing = existing_result.scalars().first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reward program '{payload.program_name}' already exists",
        )

    # Create new reward program
    new_reward = Reward(
        user_id=current_user.id,
        program_name=payload.program_name,
        points_balance=payload.points_balance,
    )

    db.add(new_reward)
    await db.commit()
    await db.refresh(new_reward)

    # Calculate currency values
    points_value_inr = ExchangeRateService.calculate_points_value(
        new_reward.points_balance
    )

    print(
        f" Created reward: {new_reward.program_name} with {new_reward.points_balance} points (₹{points_value_inr})"
    )

    return RewardResponse(
        id=new_reward.id,
        user_id=new_reward.user_id,
        program_name=new_reward.program_name,
        points_balance=new_reward.points_balance,
        last_updated=new_reward.last_updated,
        points_value_inr=points_value_inr,
        points_value_usd=await ExchangeRateService.convert_inr_to(
            points_value_inr, "USD"
        ),
        points_value_eur=await ExchangeRateService.convert_inr_to(
            points_value_inr, "EUR"
        ),
    )


# ============================================
# 2. LIST ALL REWARD PROGRAMS
# ============================================


@router.get("/", response_model=List[RewardResponse])
async def list_rewards(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all reward programs for the logged-in user.

    Security: Users can only see their own rewards (user_id filter)

    Returns: List of rewards with currency conversions
    """

    # Only fetch current user's rewards
    query = (
        select(Reward)
        .where(Reward.user_id == current_user.id)
        .order_by(Reward.last_updated.desc())
    )

    result = await db.execute(query)
    rewards = result.scalars().all()

    # Build response with currency conversions
    reward_responses = []
    for reward in rewards:
        points_value_inr = ExchangeRateService.calculate_points_value(
            reward.points_balance
        )

        reward_responses.append(
            RewardResponse(
                id=reward.id,
                user_id=reward.user_id,
                program_name=reward.program_name,
                points_balance=reward.points_balance,
                last_updated=reward.last_updated,
                points_value_inr=points_value_inr,
                points_value_usd=await ExchangeRateService.convert_inr_to(
                    points_value_inr, "USD"
                ),
                points_value_eur=await ExchangeRateService.convert_inr_to(
                    points_value_inr, "EUR"
                ),
            )
        )

    return reward_responses


# ============================================
# 3. GET SINGLE REWARD PROGRAM
# ============================================


@router.get("/{reward_id}", response_model=RewardResponse)
async def get_reward(
    reward_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get details of a specific reward program.

    Security: Verify reward belongs to current user
    """

    query = select(Reward).where(
        Reward.id == reward_id, Reward.user_id == current_user.id  # Security check
    )
    result = await db.execute(query)
    reward = result.scalars().first()

    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reward program not found"
        )

    # Calculate currency values
    points_value_inr = ExchangeRateService.calculate_points_value(reward.points_balance)

    return RewardResponse(
        id=reward.id,
        user_id=reward.user_id,
        program_name=reward.program_name,
        points_balance=reward.points_balance,
        last_updated=reward.last_updated,
        points_value_inr=points_value_inr,
        points_value_usd=await ExchangeRateService.convert_inr_to(
            points_value_inr, "USD"
        ),
        points_value_eur=await ExchangeRateService.convert_inr_to(
            points_value_inr, "EUR"
        ),
    )


# ============================================
# 4. UPDATE REWARD POINTS
# ============================================
@router.patch("/{reward_id}/points", response_model=RewardResponse)
async def update_reward_points(
    reward_id: int,
    payload: RewardPointsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Add or deduct reward points.

    Examples:
        - Add 500 points: {"points_to_add": 500}
        - Redeem 1000 points: {"points_to_add": -1000}

    Validation:
        - Cannot go below 0 points (insufficient balance error)
        - Auto-updates last_updated timestamp
    """

    query = select(Reward).where(
        Reward.id == reward_id, Reward.user_id == current_user.id
    )
    result = await db.execute(query)
    reward = result.scalars().first()

    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Reward program not found"
        )

    # Calculate new balance
    new_balance = reward.points_balance + payload.points_to_add

    # Validate sufficient points for redemption
    if new_balance < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient points. Current balance: {reward.points_balance}, attempted deduction: {abs(payload.points_to_add)}",
        )

    # Update points and timestamp (FIXED)
    reward.points_balance = new_balance
    # Use func.now() instead of datetime.now() for SQLAlchemy
    # reward.last_updated = func.now()  # This is auto-handled by onupdate

    await db.commit()
    await db.refresh(reward)

    # Calculate currency values
    points_value_inr = ExchangeRateService.calculate_points_value(reward.points_balance)

    action = "Added" if payload.points_to_add > 0 else "Redeemed"
    print(
        f" {action} {abs(payload.points_to_add)} points for {reward.program_name} → New balance: {reward.points_balance}"
    )

    return RewardResponse(
        id=reward.id,
        user_id=reward.user_id,
        program_name=reward.program_name,
        points_balance=reward.points_balance,
        last_updated=reward.last_updated,
        points_value_inr=points_value_inr,
        points_value_usd=await ExchangeRateService.convert_inr_to(
            points_value_inr, "USD"
        ),
        points_value_eur=await ExchangeRateService.convert_inr_to(
            points_value_inr, "EUR"
        ),
    )


# # ============================================
# # 5. DELETE REWARD PROGRAM
# # ============================================


# @router.delete("/{reward_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_reward(
#     reward_id: int,
#     current_user: User = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db),
# ):
#     """Delete a reward program"""

#     query = select(Reward).where(
#         Reward.id == reward_id, Reward.user_id == current_user.id
#     )
#     result = await db.execute(query)
#     reward = result.scalars().first()

#     if not reward:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="Reward program not found"
#         )

#     await db.delete(reward)
#     await db.commit()

#     print(f" Deleted reward program: {reward.program_name}")

#     return None


# ============================================
# 6. GET REWARDS SUMMARY
# ============================================


@router.get("/summary/stats", response_model=RewardSummary)
async def get_rewards_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get aggregated summary of all reward programs.

    Returns:
        - Total number of programs
        - Total points across all programs
        - Total value in INR, USD, EUR

    Use case: Display total rewards value on dashboard
    """

    query = select(Reward).where(Reward.user_id == current_user.id)
    result = await db.execute(query)
    rewards = result.scalars().all()

    #  Calculate totals
    total_programs = len(rewards)
    total_points = sum(r.points_balance for r in rewards)
    total_value_inr = ExchangeRateService.calculate_points_value(total_points)

    return RewardSummary(
        total_programs=total_programs,
        total_points=total_points,
        total_value_inr=total_value_inr,
        total_value_usd=await ExchangeRateService.convert_inr_to(
            total_value_inr, "USD"
        ),
        total_value_eur=await ExchangeRateService.convert_inr_to(
            total_value_inr, "EUR"
        ),
    )
