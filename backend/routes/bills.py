"""
Bills Management Router
Handles bill CRUD operations with automatic status updates
"""

from datetime import date
from typing import List


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth.jwt_handler import get_current_user
from database import get_db
from model import Bill, BillStatus, User
from routes.bills_schema import BillCreate, BillUpdate, BillResponse
from model import Bill, BillStatus, User, Alert, AlertType
from sqlalchemy import delete

router = APIRouter(prefix="/bills", tags=["Bills"])


# ============================================
# HELPER FUNCTIONS
# ============================================


async def get_user_bill_or_404(
    bill_id: int,
    current_user: User,
    db: AsyncSession,
) -> Bill:
    """Get bill owned by user or raise 404"""
    query = select(Bill).where(
        Bill.id == bill_id,
        Bill.user_id == current_user.id,
    )
    result = await db.execute(query)
    bill = result.scalars().first()

    if not bill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bill not found or you don't have access",
        )
    return bill


def compute_bill_status(existing_status: BillStatus, due: date) -> BillStatus:
    """
    Compute bill status based on due date.
    Logic:
    - If already paid → keep as paid
    - If due_date < today → overdue
    - Else → upcoming
    """
    if existing_status == BillStatus.paid:
        return existing_status  # Don't change paid bills

    today = date.today()
    if due < today:
        return BillStatus.overdue
    else:
        return BillStatus.upcoming


# ============================================
# 1. CREATE BILL
# ============================================


@router.post("/", response_model=BillResponse, status_code=status.HTTP_201_CREATED)
async def create_bill(
    payload: BillCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new bill.
    Status is auto-computed from due_date.
    """
    # Compute initial status
    initial_status = compute_bill_status(BillStatus.upcoming, payload.due_date)

    # Create bill
    bill = Bill(
        user_id=current_user.id,
        biller_name=payload.biller_name,
        due_date=payload.due_date,
        amount_due=payload.amount_due,
        auto_pay=payload.auto_pay,
        status=initial_status,
    )

    db.add(bill)
    await db.commit()
    await db.refresh(bill)

    print(
        f"Created bill #{bill.id} for {bill.biller_name} - Status: {bill.status.value}"
    )

    return bill


# ============================================
# 2. LIST ALL BILLS
# ============================================


@router.get("/", response_model=List[BillResponse])
async def list_bills(
    status_filter: str = None,  # Query param: ?status=upcoming
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List all bills for logged-in user.
    Optional filter by status.
    """
    query = select(Bill).where(Bill.user_id == current_user.id)

    # Apply status filter if provided
    if status_filter:
        try:
            status_enum = BillStatus(status_filter)
            query = query.where(Bill.status == status_enum)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be: upcoming, paid, or overdue",
            )

    # Order by due date (soonest first)
    query = query.order_by(Bill.due_date.asc())

    result = await db.execute(query)
    bills = result.scalars().all()

    # Auto-update status for each bill
    for bill in bills:
        old_status = bill.status
        new_status = compute_bill_status(bill.status, bill.due_date)
        if old_status != new_status:
            bill.status = new_status
            print(
                f" Auto-updated bill #{bill.id} status: {old_status.value} → {new_status.value}"
            )

    if bills:
        await db.commit()

    return bills


# ============================================
# 3. GET SINGLE BILL
# ============================================


@router.get("/{bill_id}", response_model=BillResponse)
async def get_bill(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get single bill by ID"""
    bill = await get_user_bill_or_404(bill_id, current_user, db)

    # Auto-update status
    old_status = bill.status
    bill.status = compute_bill_status(bill.status, bill.due_date)
    if old_status != bill.status:
        await db.commit()

    return bill


# ============================================
# 4. UPDATE BILL
# ============================================


@router.put("/{bill_id}", response_model=BillResponse)
async def update_bill(
    bill_id: int,
    payload: BillUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update bill fields.
    Common use case: Mark bill as paid
    """
    bill = await get_user_bill_or_404(bill_id, current_user, db)

    # Apply updates
    if payload.biller_name is not None:
        bill.biller_name = payload.biller_name

    if payload.due_date is not None:
        bill.due_date = payload.due_date

    if payload.amount_due is not None:
        bill.amount_due = payload.amount_due

    if payload.auto_pay is not None:
        bill.auto_pay = payload.auto_pay

    # Manual status override (e.g., mark as paid)
    if payload.status is not None:
        try:
            bill.status = BillStatus(payload.status)
            print(f" Manually set bill #{bill_id} status to: {payload.status}")
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status value"
            )
    else:
        # Auto-compute status if not manually set
        bill.status = compute_bill_status(bill.status, bill.due_date)

    #  NEW: Clear related alerts when bill is marked as paid
    if bill.status == BillStatus.paid:
        del_stmt = delete(Alert).where(
            Alert.user_id == current_user.id,
            Alert.alert_type == AlertType.bill_due,
            Alert.message.contains(bill.biller_name),
        )
        result = await db.execute(del_stmt)
        print(f"  Cleared {result.rowcount} alert(s) for bill: {bill.biller_name}")

    await db.commit()
    await db.refresh(bill)

    return bill


# ============================================
# 5. DELETE BILL
# ============================================


@router.delete("/{bill_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bill(
    bill_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a bill"""
    bill = await get_user_bill_or_404(bill_id, current_user, db)

    await db.delete(bill)
    await db.commit()

    print(f"  Deleted bill #{bill_id} ({bill.biller_name})")

    return None


# ============================================
# 6. GET BILL SUMMARY
# ============================================


@router.get("/summary/stats")
async def get_bills_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get summary statistics:
    - Total upcoming bills
    - Total overdue bills
    - Total amount due
    """
    query = select(Bill).where(Bill.user_id == current_user.id)
    result = await db.execute(query)
    bills = result.scalars().all()

    # Auto-update statuses
    for bill in bills:
        bill.status = compute_bill_status(bill.status, bill.due_date)
    await db.commit()

    # Calculate stats
    upcoming_count = sum(1 for b in bills if b.status == BillStatus.upcoming)
    overdue_count = sum(1 for b in bills if b.status == BillStatus.overdue)
    paid_count = sum(1 for b in bills if b.status == BillStatus.paid)

    total_due = sum(float(b.amount_due) for b in bills if b.status != BillStatus.paid)

    return {
        "total_bills": len(bills),
        "upcoming": upcoming_count,
        "overdue": overdue_count,
        "paid": paid_count,
        "total_amount_due": round(total_due, 2),
    }
