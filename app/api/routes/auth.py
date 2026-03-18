from typing import Any
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.api import deps
from app.services.auth_service import auth_service
from app.models.schemas import UserCreate, Token

router = APIRouter()

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(deps.get_db)) -> Any:
    """Create new user and return tokens."""
    return auth_service.register(db, user_in)

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(deps.get_db)) -> Any:
    """OAuth2 compatible token login, get an access token for future requests."""
    return auth_service.login(db, form_data.username, form_data.password)

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_token: str, db: Session = Depends(deps.get_db)) -> Any:
    """Refresh an access token using a valid refresh token."""
    return auth_service.refresh_token(db, refresh_token)
