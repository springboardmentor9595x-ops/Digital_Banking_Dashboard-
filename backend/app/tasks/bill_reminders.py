from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.celery_app import celery_app
from app.db.database import SessionLocal
from app.models.bill import Bill


@celery_app.task
def check_bill_reminders():
    db: Session = SessionLocal()

    today = datetime.now().date()
    upcoming_limit = today + timedelta(days=3)

    bills = db.query(Bill).all()

    for bill in bills:
        if bill.status == "paid":
            continue

        if today <= bill.due_date <= upcoming_limit:
            print(
                f"🔔 UPCOMING BILL: {bill.biller_name} | "
                f"Due: {bill.due_date} | Amount: ₹{bill.amount_due}"
            )

        elif bill.due_date < today:
            print(
                f"🚨 OVERDUE BILL: {bill.biller_name} | "
                f"Due: {bill.due_date} | Amount: ₹{bill.amount_due}"
            )

    db.close()
    return "done"
