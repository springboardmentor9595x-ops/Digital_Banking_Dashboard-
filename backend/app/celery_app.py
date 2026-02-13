from celery import Celery
from celery.schedules import crontab

celery_app = Celery(
    "app",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["app.tasks"]
)

celery_app.conf.timezone = "UTC"

# Run every 1 minute (for testing)
celery_app.conf.beat_schedule = {
    "check-bill-reminders-every-minute": {
        "task": "app.tasks.check_bill_reminders",
        "schedule": crontab(minute="*/1"),
    }
}
