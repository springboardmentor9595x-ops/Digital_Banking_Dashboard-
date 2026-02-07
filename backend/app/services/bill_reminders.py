from datetime import date, timedelta
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.bill import Bill


def check_bill_reminders():
    db: Session = SessionLocal()
    try:
        today = date.today()
        upcoming_limit = today + timedelta(days=3)  # N days = 3

        bills = db.query(Bill).filter(
            Bill.reminder_sent == False,
            Bill.status != "paid"
        ).all()

        for bill in bills:
            # Upcoming bills
            if today <= bill.due_date <= upcoming_limit:
                print(f"🔔 REMINDER: Upcoming bill '{bill.biller_name}' due on {bill.due_date}")
                bill.reminder_sent = True

            # Overdue bills
            elif bill.due_date < today:
                print(f"⚠️ REMINDER: OVERDUE bill '{bill.biller_name}' was due on {bill.due_date}")
                bill.reminder_sent = True

        db.commit()
    finally:
        db.close()
