from fastapi import APIRouter, Depends
from typing import List
from app.models.schemas import SessionSchema, MessageSchema
from app.models.user import User
from app.api import deps
from app.services.session_service import session_service

router = APIRouter()

@router.get("/", response_model=List[SessionSchema])
async def list_sessions(current_user: User = Depends(deps.get_current_user)):
    """List all active team sessions."""
    return session_service.list_sessions(current_user)

@router.get("/{session_id}/history", response_model=List[MessageSchema])
async def get_session_history(session_id: str, current_user: User = Depends(deps.get_current_user)):
    """Get chat history for a specific session."""
    return session_service.get_session_history(current_user, session_id)

@router.get("/{session_id}/status")
async def get_session_status(session_id: str, current_user: User = Depends(deps.get_current_user)):
    """Get the current generation status of a session."""
    return {"status": "EM_CONSTRUCAO"}

@router.delete("/{session_id}")
async def delete_session(session_id: str, current_user: User = Depends(deps.get_current_user)):
    """Delete a specific session."""
    return session_service.delete_session(current_user, session_id)

@router.delete("/")
async def clear_all_sessions(current_user: User = Depends(deps.get_current_user)):
    """Delete ALL sessions for current user."""
    return session_service.clear_all_sessions(current_user)
