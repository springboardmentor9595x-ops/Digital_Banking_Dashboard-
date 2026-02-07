from datetime import date, timedelta

from app.db.database import SessionLocal
from app.models.bill import Bill
from app.celery_app import celery_app


@celery_app.task(name="check_bill_reminders")
def check_bill_reminders():
    db = SessionLocal()

    today = date.today()
    upcoming_limit = today + timedelta(days=3)

    bills = (
        db.query(Bill)
        .filter(
            Bill.status != "paid",
            Bill.reminder_sent == False
        )
        .all()
    )

    for bill in bills:
        if bill.due_date < today:
            print(
                f"⚠️ REMINDER: OVERDUE bill '{bill.biller_name}' "
                f"was due on {bill.due_date}"
            )
            bill.reminder_sent = True

        elif today <= bill.due_date <= upcoming_limit:
            print(
                f"🔔 REMINDER: Upcoming bill '{bill.biller_name}' "
                f"due on {bill.due_date}"
            )
            bill.reminder_sent = True

    db.commit()
    db.close()
