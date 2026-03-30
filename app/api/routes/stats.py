from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.services.stats_service import stats_service
from app.models.schemas import StatsResponse

router = APIRouter()

@router.get("", response_model=StatsResponse)
async def get_stats(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return stats_service.get_user_stats(db, current_user)
