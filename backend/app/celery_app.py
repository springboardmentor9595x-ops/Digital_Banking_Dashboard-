from celery import Celery

celery_app = Celery(
    "banking_app",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)

# ✅ Explicitly import tasks so Celery registers them
import app.tasks.bill_reminders
