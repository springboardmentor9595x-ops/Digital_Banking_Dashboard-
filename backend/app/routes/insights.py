from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.routes.auth import get_current_user

router = APIRouter(
    prefix="/insights",
    tags=["Insights"]
)

@router.get("/")
def get_insights(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        import app.services.insights_service as insights_service

        return {
            "cashflow": insights_service.calculate_monthly_cashflow(db, current_user.id),
            "top_merchants": insights_service.get_top_merchants(db, current_user.id),
            "category_summary": insights_service.category_spending_summary(db, current_user.id),
            "burn_rate": insights_service.calculate_burn_rate(db, current_user.id)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
