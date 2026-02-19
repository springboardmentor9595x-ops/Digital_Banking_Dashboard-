from sqlalchemy.orm import Session
from app.models.alert import Alert


def create_alert_if_not_exists(db: Session, user_id: int, alert_type: str, message: str):

    existing = db.query(Alert).filter(
        Alert.user_id == user_id,
        Alert.alert_type == alert_type,
        Alert.message == message,
        Alert.read_status == False
    ).first()

    if not existing:
        alert = Alert(
            user_id=user_id,
            alert_type=alert_type,
            message=message
        )
        db.add(alert)
        db.commit()


def get_user_alerts(db: Session, user_id: int):
    return db.query(Alert).filter(
        Alert.user_id == user_id
    ).order_by(Alert.created_at.desc()).all()


def mark_alert_as_read(db: Session, user_id: int, alert_id: int):
    alert = db.query(Alert).filter(
        Alert.id == alert_id,
        Alert.user_id == user_id
    ).first()

    if alert:
        alert.read_status = True
        db.commit()
