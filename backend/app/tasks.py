from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import Bill
from app.celery_app import celery_app
from app.utils.email_service import send_email

@celery_app.task
def check_bill_reminders():
    db = SessionLocal()

    today = datetime.utcnow()
    upcoming_limit = today + timedelta(days=3)

    bills = db.query(Bill).filter(
        Bill.status != "paid",
        Bill.reminder_sent == False
    ).all()

    for bill in bills:
        print(
            "DEBUG →",
            bill.biller_name,
            "| due:", bill.due_date,
            "| status:", bill.status,
            "| reminder_sent:", bill.reminder_sent
        )

        # OVERDUE BILL
        if bill.due_date < today:
            bill.status = "overdue"

            send_email(
                to_email=bill.user.email,
                subject="Overdue Bill Alert",
                body=f"Your {bill.biller_name} bill of ₹{bill.amount_due} is overdue!"
            )
            bill.reminder_sent = True

        # UPCOMING BILL (within next 3 days)
        elif today <= bill.due_date <= upcoming_limit:
            bill.status = "upcoming"

            send_email(
                to_email=bill.user.email,
                subject="Upcoming Bill Reminder",
                body=f"Your {bill.biller_name} bill of ₹{bill.amount_due} is due on {bill.due_date}"
            )
            bill.reminder_sent = True

        print(
            "AFTER →",
            bill.biller_name,
            "| status:", bill.status,
            "| reminder_sent:", bill.reminder_sent
        )

    db.commit()
    db.close()
