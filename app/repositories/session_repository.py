from typing import List, Optional, Any
from app.core.agno_agent import db
from agno.db.base import SessionType

class SessionRepository:
    def get_session(self, session_id: str, session_type: SessionType = SessionType.AGENT) -> Optional[Any]:
        return db.get_session(session_id, session_type)
        
    def get_sessions(self, session_type: SessionType = SessionType.AGENT) -> List[Any]:
        return db.get_sessions(session_type) or []
        
    def delete_session(self, session_id: str) -> bool:
        return db.delete_session(session_id)
        
    def delete_sessions(self, session_ids: list[str]) -> bool:
        db.delete_sessions(session_ids)
        return True

session_repository = SessionRepository()
