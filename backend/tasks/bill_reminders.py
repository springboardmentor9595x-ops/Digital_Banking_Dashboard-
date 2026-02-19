"""
Bill Reminder Background Tasks
Automated reminders for upcoming and overdue bills
"""

from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.orm import Session

from celery_config import celery_app
from database import get_sync_db
from model import Bill, BillStatus, User, Alert, AlertType


def send_reminder(user: User, bill: Bill, reminder_type: str):
    """
    Send bill reminder to user (console output for now)
    Can be extended to send emails
    """
    today = date.today()

    if reminder_type == "UPCOMING":
        days_until = (bill.due_date - today).days
        status_text = f"DUE IN {days_until} DAYS"
    else:  # OVERDUE
        days_overdue = (today - bill.due_date).days
        status_text = f"OVERDUE BY {days_overdue} DAYS"

    message = f"""
    ╔══════════════════════════════════════╗
    ║  📧 BILL REMINDER - {status_text}
    ╠══════════════════════════════════════╣
    ║  User: {user.name} ({user.email})
    ║  Biller: {bill.biller_name}
    ║  Amount: ₹{bill.amount_due}
    ║  Due Date: {bill.due_date}
    ║  Status: {bill.status.value.upper()}
    ╚══════════════════════════════════════╝
    """

    print(message)


def create_alert(db: Session, user_id: int, alert_type: str, message: str):
    """Create alert in database"""
    try:
        alert = Alert(
            user_id=user_id, alert_type=AlertType(alert_type), message=message
        )
        db.add(alert)
        db.commit()
        print(f"  ✅ Alert created for user {user_id}")
    except Exception as e:
        print(f"  ❌ Failed to create alert: {e}")
        db.rollback()


@celery_app.task(name="tasks.bill_reminders.check_upcoming_bills")
def check_upcoming_bills():
    """Check for bills due in next 3 days"""
    print("\n🔔 TASK: Checking upcoming bills...")

    db = next(get_sync_db())

    try:
        today = date.today()
        upcoming_date = today + timedelta(days=3)

        print(f"   Date range: {today} to {upcoming_date}")

        # Find upcoming bills
        query = select(Bill).where(
            Bill.status == BillStatus.upcoming,
            Bill.due_date >= today,
            Bill.due_date <= upcoming_date,
        )

        bills = db.execute(query).scalars().all()
        print(f"   Found {len(bills)} upcoming bills")

        reminders_sent = 0

        for bill in bills:
            user = (
                db.execute(select(User).where(User.id == bill.user_id))
                .scalars()
                .first()
            )

            if not user:
                continue

            # Check if already sent today - FIXED: Use bill_due with underscore
            alert_query = select(Alert).where(
                Alert.user_id == user.id,
                Alert.alert_type == AlertType.bill_due,  # ← FIXED
                Alert.message.contains(bill.biller_name),
                Alert.created_at >= today,
            )

            if db.execute(alert_query).scalars().first():
                print(f"  ⏭️  Already sent for bill #{bill.id}")
                continue

            # Send reminder
            send_reminder(user, bill, "UPCOMING")

            # Create alert
            days_until = (bill.due_date - today).days
            alert_msg = f"Bill from {bill.biller_name} for ₹{bill.amount_due} is due on {bill.due_date} ({days_until} days)"
            create_alert(db, user.id, "bill_due", alert_msg)

            reminders_sent += 1

        print(f"✅ Sent {reminders_sent} upcoming reminders\n")

        return {"status": "success", "reminders_sent": reminders_sent}

    except Exception as e:
        print(f"❌ TASK FAILED: {e}\n")
        import traceback

        traceback.print_exc()
        return {"status": "error", "message": str(e)}

    finally:
        db.close()


@celery_app.task(name="tasks.bill_reminders.check_overdue_bills")
def check_overdue_bills():
    """Check for overdue bills and update status"""
    print("\n🚨 TASK: Checking overdue bills...")

    db = next(get_sync_db())

    try:
        today = date.today()

        # Find overdue bills
        query = select(Bill).where(
            Bill.status != BillStatus.paid, Bill.due_date < today
        )

        bills = db.execute(query).scalars().all()
        print(f"   Found {len(bills)} overdue bills")

        reminders_sent = 0

        for bill in bills:
            # Auto-update status to overdue
            if bill.status != BillStatus.overdue:
                bill.status = BillStatus.overdue
                db.commit()
                print(f"  🔄 Updated bill #{bill.id} to OVERDUE")

            user = (
                db.execute(select(User).where(User.id == bill.user_id))
                .scalars()
                .first()
            )

            if not user:
                continue

            # Check if already sent today - FIXED: Use bill_due with underscore
            alert_query = select(Alert).where(
                Alert.user_id == user.id,
                Alert.alert_type == AlertType.bill_due,  # ← FIXED
                Alert.message.contains(bill.biller_name),
                Alert.created_at >= today,
            )

            if db.execute(alert_query).scalars().first():
                print(f"  ⏭️  Already sent for bill #{bill.id}")
                continue

            # Send reminder
            send_reminder(user, bill, "OVERDUE")

            # Create alert
            days_overdue = (today - bill.due_date).days
            alert_msg = f"⚠️ OVERDUE: Bill from {bill.biller_name} for ₹{bill.amount_due} was due on {bill.due_date} ({days_overdue} days ago)"
            create_alert(db, user.id, "bill_due", alert_msg)

            reminders_sent += 1

        print(f"✅ Sent {reminders_sent} overdue reminders\n")

        return {"status": "success", "reminders_sent": reminders_sent}

    except Exception as e:
        print(f"❌ TASK FAILED: {e}\n")
        import traceback

        traceback.print_exc()
        return {"status": "error", "message": str(e)}

    finally:
        db.close()


@celery_app.task(name="tasks.bill_reminders.check_all_bills")
def check_all_bills():
    """Check both upcoming and overdue bills"""
    print("\n🔍 TASK: Checking all bills...\n")

    upcoming = check_upcoming_bills()
    overdue = check_overdue_bills()

    return {"upcoming": upcoming, "overdue": overdue}
