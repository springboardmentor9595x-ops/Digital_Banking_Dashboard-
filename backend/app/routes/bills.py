from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date

from app.deps import get_db
from app.schemas import BillCreate, BillOut
from app.models import Bill

router = APIRouter(prefix="/bills", tags=["Bills"])


# ✅ STATUS CALCULATION WITH DEBUG PRINT
def calculate_status(due_date: date) -> str:
    today = date.today()

    # 🔍 DEBUG LINE (VERY IMPORTANT)
    print("TODAY:", today, "DUE:", due_date)

    if due_date < today:
        return "overdue"
    elif due_date == today:
        return "due"
    else:
        return "upcoming"


# ✅ CREATE BILL
@router.post("/", response_model=BillOut)
def create_bill(bill: BillCreate, db: Session = Depends(get_db)):
    status = calculate_status(bill.due_date)

    new_bill = Bill(
        biller_name=bill.biller_name,
        amount_due=bill.amount_due,
        due_date=bill.due_date,
        status=status
    )
    db.add(new_bill)
    db.commit()
    db.refresh(new_bill)
    return new_bill


# ✅ GET ALL BILLS (RE-CALCULATES STATUS EVERY TIME)
@router.get("/", response_model=list[BillOut])
def get_bills(db: Session = Depends(get_db)):
    bills = db.query(Bill).all()

    for bill in bills:
        bill.status = calculate_status(bill.due_date)

    db.commit()
    return bills
