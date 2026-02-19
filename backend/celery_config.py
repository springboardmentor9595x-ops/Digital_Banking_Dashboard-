"""
Celery Configuration for Background Tasks
"""

from celery import Celery
from celery.schedules import crontab
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Initialize Celery
celery_app = Celery(
    "banking_dashboard",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["tasks.bill_reminders"],
)

# Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=False,
    result_expires=86400,
)

# Scheduled tasks
celery_app.conf.beat_schedule = {
    # Daily check at 9 AM
    "check-upcoming-bills-daily": {
        "task": "tasks.bill_reminders.check_upcoming_bills",
        "schedule": crontab(hour=9, minute=0),
    },
    # Daily check at 10 AM
    # FOR TESTING: Every 2 minutes (remove after testing)
    # "check-bills-test": {
    #     "task": "tasks.bill_reminders.check_all_bills",
    #     "schedule": crontab(minute="*/1"),
    # },
}
