from fastapi import HTTPException
from app.repositories.session_repository import session_repository
from agno.db.base import SessionType
from app.models.user import User
from app.core.agno_agent import remove_team_from_cache

class SessionService:
    def list_sessions(self, current_user: User) -> list[dict]:
        sessions = session_repository.get_sessions(session_type=SessionType.AGENT)
        if not sessions:
            sessions = session_repository.get_sessions(session_type=SessionType.TEAM)
        
        # Filter by user prefix
        sessions = [s for s in sessions if s.session_id.startswith(f"{current_user.id}_")]
        sessions.sort(key=lambda x: x.created_at or 0, reverse=True)
        
        result = []
        for s in sessions:
            title = "Nova Conversa"
            if s.session_data and "title" in s.session_data:
                title = s.session_data["title"]
                
            result.append({
                "session_id": s.session_id.replace(f"{current_user.id}_", ""),
                "title": title,
                "created_at": s.created_at
            })
        return result

    def get_session_history(self, current_user: User, session_id: str) -> list[dict]:
        actual_session_id = f"{current_user.id}_{session_id}"
        
        session_data = session_repository.get_session(actual_session_id, SessionType.AGENT)
        if not session_data:
            session_data = session_repository.get_session(actual_session_id, SessionType.TEAM)
            
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        history = session_data.get_chat_history()
        
        messages = []
        for msg in history:
            messages.append({
                "role": msg.role,
                "content": msg.content or "",
                "created_at": msg.created_at
            })
        return messages

    def delete_session(self, current_user: User, session_id: str) -> dict:
        actual_session_id = f"{current_user.id}_{session_id}"
        success = session_repository.delete_session(actual_session_id)
        if not success:
            raise HTTPException(status_code=404, detail="Session not found")
        remove_team_from_cache(actual_session_id)
        return {"status": "success", "message": "Session deleted"}

    def clear_all_sessions(self, current_user: User) -> dict:
        sessions = session_repository.get_sessions(session_type=SessionType.AGENT)
        session_ids = [s.session_id for s in sessions if s.session_id.startswith(f"{current_user.id}_")]
        if session_ids:
            session_repository.delete_sessions(session_ids)
        return {"status": "success", "message": f"Deleted {len(session_ids)} sessions"}

session_service = SessionService()
