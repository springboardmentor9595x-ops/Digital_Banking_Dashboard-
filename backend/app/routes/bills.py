from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime
from ..database import get_db
from ..deps import get_current_user
from ..models import Bill
from app.models import Alert
from ..models import Account, Transaction, Alert
from app.services.alert_service import create_alert


router = APIRouter(prefix="/bills", tags=["Bills"])


# ---------- Schemas ----------

class BillCreate(BaseModel):
    account_id: int
    biller_name: str
    due_date: datetime
    amount_due: float
    auto_pay: bool = False


class BillUpdate(BaseModel):
    biller_name: str
    due_date: datetime
    amount_due: float
    status: str
    auto_pay: bool


class BillResponse(BaseModel):
    id: int
    biller_name: str
    due_date: datetime
    amount_due: float
    status: str
    auto_pay: bool

    class Config:
        from_attributes = True


# ---------- Create Bill ----------
@router.post("/", response_model=BillResponse)
def create_bill(data: BillCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    bill = Bill(
        user_id=current_user.id,
        account_id=data.account_id,
        biller_name=data.biller_name,
        due_date=data.due_date,
        amount_due=data.amount_due,
        auto_pay=data.auto_pay,
        status="upcoming"
    )
    db.add(bill)
    db.commit()
    db.refresh(bill)
    alert = Alert(
    user_id=current_user.id,
    type="info",
message=f"Bill added: {bill.biller_name} (₹{bill.amount_due})"

)
    db.add(alert)
    db.commit()
    return bill
   





# ---------- List Bills ----------
@router.get("/", response_model=List[BillResponse])
def list_bills(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    process_autopay(db)

    bills = db.query(Bill).filter(Bill.user_id == current_user.id).all()
    today = datetime.utcnow()


    for bill in bills:
        if bill.status != "paid":
            if bill.due_date < today:
                bill.status = "overdue"
                create_alert(
                db,
                current_user.id,
                "bill_due",
                f"Bill overdue: {bill.biller_name}"
            )
            else:
                bill.status = "upcoming"

    db.commit()
    return bills

def get_user_bill(db, bill_id, user_id):
    bill = db.query(Bill).filter(
        Bill.id == bill_id,
        Bill.user_id == user_id
    ).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found or access denied")
    return bill


# ---------- Update Bill ----------
@router.put("/{bill_id}", response_model=BillResponse)
def update_bill(bill_id: int, data: BillUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    bill = get_user_bill(db, bill_id, current_user.id)

    bill.biller_name = data.biller_name
    bill.due_date = data.due_date
    bill.amount_due = data.amount_due
    bill.status = data.status
    bill.auto_pay = data.auto_pay

    db.commit()
    db.refresh(bill)
    return bill


# ---------- Delete Bill ----------
@router.delete("/{bill_id}")
def delete_bill(bill_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    bill = get_user_bill(db, bill_id, current_user.id)

    db.delete(bill)
    db.commit()
    return {"message": "Bill deleted successfully"}


def process_autopay(db: Session):
    today = datetime.utcnow().date()

    bills = db.query(Bill).filter(
        Bill.auto_pay == True,
        Bill.status != "paid"
    ).all()

    print("Running AutoPay...")


    for bill in bills:
        print("Checking bill:", bill.biller_name, bill.due_date)



        if bill.due_date.date() <= today:


            account = db.query(Account).filter(
                Account.id == bill.account_id
            ).first()

            if account and account.balance >= bill.amount_due:

                # Deduct money
                account.balance -= bill.amount_due

                # Mark bill paid
                bill.status = "paid"
                create_alert(
    db,
    bill.user_id,
    "bill_paid",
    f"AutoPay successful for {bill.biller_name}"
)

                # Create transaction
                trx = Transaction(
                    user_id=bill.user_id,
                    account_id=bill.account_id,
                    type="expense",
                    amount=bill.amount_due,
                    category="Bills",
                    description=f"AutoPay - {bill.biller_name}",
                    date=datetime.utcnow()
                )

                db.add(trx)
        

    db.commit()
