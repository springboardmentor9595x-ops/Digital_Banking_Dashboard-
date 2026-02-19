from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)


@router.get("/")
def fetch_alerts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    import app.services.alerts_service as alerts_service

    alerts = alerts_service.get_user_alerts(db, current_user.id)

    return [
        {
            "id": alert.id,
            "alert_type": alert.alert_type,
            "message": alert.message,
            "created_at": alert.created_at,
            "read_status": alert.read_status
        }
        for alert in alerts
    ]


@router.put("/{alert_id}/read")
def mark_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    import app.services.alerts_service as alerts_service

    alerts_service.mark_alert_as_read(db, current_user.id, alert_id)

    return {"message": "Alert marked as read"}
