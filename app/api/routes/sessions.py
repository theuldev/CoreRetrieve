
from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.core.agno_agent import db, get_team, remove_team_from_cache, clear_all_team_cache
from agno.db.base import SessionType

router = APIRouter()

class SessionSchema(BaseModel):
    session_id: str
    title: str
    created_at: Optional[int] = None

class MessageSchema(BaseModel):
    role: str
    content: str
    created_at: Optional[int] = None

@router.get("/", response_model=List[SessionSchema])
async def list_sessions():
    """List all active team sessions."""
    sessions = db.get_sessions(session_type=SessionType.TEAM)
    sessions.sort(key=lambda x: x.created_at or 0, reverse=True)
    
    result = []
    for s in sessions:
        title = "Nova Conversa"
        if s.session_data and "title" in s.session_data:
            title = s.session_data["title"]
        else:
             pass 

        result.append(SessionSchema(
            session_id=s.session_id,
            title=title,
            created_at=s.created_at
        ))
    return result

@router.get("/{session_id}/history", response_model=List[MessageSchema])
async def get_session_history(session_id: str):
    """Get chat history for a specific session."""
    team = get_team(session_id)
    
    session_data = db.get_session(session_id, SessionType.TEAM)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    history = session_data.get_chat_history()
    
    messages = []
    for msg in history:
        messages.append(MessageSchema(
            role=msg.role,
            content=msg.content or "",
            created_at=msg.created_at
        ))
    
    return messages

@router.get("/{session_id}/status")
async def get_session_status(session_id: str):
    """Get the current generation status of a session."""
    from app.core.tools import session_states
    
    if session_id in session_states:
        return {"status": session_states[session_id].get("status", "EM_CONSTRUCAO")}
    return {"status": "NO_STATE"}

@router.delete("/{session_id}")
async def delete_session(session_id: str):
    """Delete a specific session."""
    success = db.delete_session(session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Session not found")
    remove_team_from_cache(session_id)
    return {"status": "success", "message": "Session deleted"}

@router.delete("/")
async def clear_all_sessions():
    """Delete ALL sessions (Factory Reset)."""
    sessions = db.get_sessions(session_type=SessionType.TEAM)
    session_ids = [s.session_id for s in sessions]
    if session_ids:
        db.delete_sessions(session_ids)
    clear_all_team_cache()
    return {"status": "success", "message": f"Deleted {len(session_ids)} sessions"}
