from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api import deps
from app.models.user import User
from app.models.schemas import UserSettingsUpdate, UserResponse
from app.services.user_service import user_service

router = APIRouter()

@router.get("/me/settings", response_model=UserResponse)
def get_user_settings(current_user: User = Depends(deps.get_current_user)) -> Any:
    """Get current user settings."""
    return current_user

@router.put("/me/settings", response_model=UserResponse)
def update_user_settings(
    settings: UserSettingsUpdate,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """Update current user settings."""
    return user_service.update_settings(db, current_user, settings)
