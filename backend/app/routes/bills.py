from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from app.config.database import get_db
from app.models.bill import Bill
from app.schemas.bill import BillCreate, BillUpdate, BillOut
from app.models.user import User
from app.core.security import get_current_user
# ✅ ADD THIS
from app.tasks.bill_reminders import check_bill_reminders

router = APIRouter(
    prefix="/bills",
    tags=["Bills"]
)

# =========================
# STATUS CALCULATION
# =========================
def calculate_status(due_date: date) -> str:
    today = date.today()

    if due_date < today:
        return "overdue"
    elif due_date == today:
        return "due"
    else:
        return "upcoming"


# =========================
# CREATE BILL
# =========================
@router.post("/", response_model=BillOut)
def create_bill(
    bill: BillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    status = calculate_status(bill.due_date)

    new_bill = Bill(
        user_id=current_user.id,
        biller_name=bill.biller_name,
        amount_due=bill.amount_due,
        due_date=bill.due_date,
        status=status,
        auto_pay=bill.auto_pay
    )

    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)

    # ✅ THIS IS THE KEY LINE (TRIGGER CELERY)
    check_bill_reminders.delay()

    return new_bill


# =========================
# GET ALL BILLS (USER ONLY)
# =========================
@router.get("/", response_model=list[BillOut])
def get_bills(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bills = (
        db.query(Bill)
        .filter(Bill.user_id == current_user.id)
        .all()
    )

    # update status dynamically
    for bill in bills:
        if bill.status != "paid":
            bill.status = calculate_status(bill.due_date)

    return bills


# =========================
# UPDATE BILL (USER ONLY)
# =========================
@router.put("/{bill_id}", response_model=BillOut)
def update_bill(
    bill_id: int,
    bill_data: BillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = (
        db.query(Bill)
        .filter(
            Bill.id == bill_id,
            Bill.user_id == current_user.id
        )
        .first()
    )

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    for key, value in bill_data.dict(exclude_unset=True).items():
        setattr(bill, key, value)

    # recalculate status if due date changes
    if bill.due_date and bill.status != "paid":
        bill.status = calculate_status(bill.due_date)

    db.commit()
    db.refresh(bill)

    return bill


# =========================
# DELETE BILL (USER ONLY)
# =========================
@router.delete("/{bill_id}")
def delete_bill(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bill = (
        db.query(Bill)
        .filter(
            Bill.id == bill_id,
            Bill.user_id == current_user.id
        )
        .first()
    )

    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    db.delete(bill)
    db.commit()

    return {"message": "Bill deleted successfully"}
