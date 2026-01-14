from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..auth.jwt_handler import get_current_user
from ..database import get_db
from ..model import Account, AccountType, User          # adjust import path if needed
from .accounts_schema import AccountCreate, AccountUpdate, AccountResponse

router = APIRouter(
prefix="/accounts",
tags=["Accounts"],
)
@router.post(
    "",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_account(
    payload: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new account for the logged-in user.
    - Links account to current_user.id  (task 3)
    - Validates input via AccountCreate (task 2)
    - Stores balance and currency (task 4)
    """
    # Convert account_type string: Enum
    try:
        account_type_enum = AccountType(payload.account_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid account_type value",
        )
    new_account = Account(
        user_id=current_user.id,               # link to logged-in user
        bank_name=payload.bank_name,
        account_type=account_type_enum,
        masked_account=payload.masked_account,
        currency=payload.currency,
        balance=payload.balance,              # store balance
    )
    db.add(new_account)
    await db.commit()
    await db.refresh(new_account)
    return new_account
@router.get(
    "",
    response_model=List[AccountResponse],
)
async def list_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all accounts that belong to the logged-in user.
    """
    query = select(Account).where(Account.user_id == current_user.id)
    result = await db.execute(query)
    accounts = result.scalars().all()
    return accounts
@router.get(
    "/{account_id}",
    response_model=AccountResponse,
)
async def get_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single account by id, but only if it belongs to the logged-in user.
    """
    query = select(Account).where(
        Account.id == account_id,
        Account.user_id == current_user.id,
    )
    result = await db.execute(query)
    account = result.scalars().first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    return account
@router.put(
    "/{account_id}",
    response_model=AccountResponse,
)
async def update_account(
    account_id: int,
    payload: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update an existing account owned by the logged-in user.
    """
    query = select(Account).where(
        Account.id == account_id,
        Account.user_id == current_user.id,
    )
    result = await db.execute(query)
    account = result.scalars().first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    # Validate account_type enum
    try:
        account_type_enum = AccountType(payload.account_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid account_type value",
        )
    account.bank_name = payload.bank_name
    account.account_type = account_type_enum
    account.masked_account = payload.masked_account
    account.currency = payload.currency
    account.balance = payload.balance
    await db.commit()
    await db.refresh(account)
    return account
@router.delete(
    "/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete an account owned by the logged-in user.
    """
    query = select(Account).where(
        Account.id == account_id,
        Account.user_id == current_user.id,
    )
    result = await db.execute(query)
    account = result.scalars().first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )
    await db.delete(account)
    await db.commit()
    # 204 - no response body
