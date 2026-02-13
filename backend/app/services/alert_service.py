from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Alert


def create_alert(db: Session, user_id: int, alert_type: str, message: str):
    # Check if same unread alert already exists
    existing = db.query(Alert).filter(
        Alert.user_id == user_id,
        Alert.alert_type == alert_type,
        Alert.message == message,
        Alert.read_status == False
    ).first()

    if existing:
        return  # Do not create duplicate

    alert = Alert(
        user_id=user_id,
        alert_type=alert_type,
        message=message,
        created_at=datetime.utcnow(),
        read_status=False
    )

    db.add(alert)
    db.commit()
