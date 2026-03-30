from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, File
from app.repositories.session_repository import session_repository
from agno.db.base import SessionType
import time
from datetime import datetime, timedelta

class StatsService:
    def get_user_stats(self, db: Session, current_user: User) -> dict:
        # Total files
        total_files = db.query(File).filter(File.user_id == current_user.id).count()
        
        # Total sessions
        sessions = session_repository.get_sessions(session_type=SessionType.AGENT)
        user_sessions = [s for s in sessions if s.session_id.startswith(f"{current_user.id}_")]
        total_sessions = len(user_sessions)
        
        # Total messages
        total_messages = 0
        for s in user_sessions:
            history = s.get_chat_history()
            if history:
                total_messages += len(history)
        
        # Activity timeline (last 7 days)
        activity_timeline = []
        now = datetime.now()
        for i in range(6, -1, -1):
            date = now - timedelta(days=i)
            date_str = date.strftime("%Y-%m-%d")
            
            # Count messages in that day (this is a bit simplified since we don't have message timestamps in a separate table)
            count = 0
            for s in user_sessions:
                history = s.get_chat_history()
                if history:
                    for msg in history:
                        if msg.created_at:
                            msg_date = datetime.fromtimestamp(msg.created_at).strftime("%Y-%m-%d")
                            if msg_date == date_str:
                                count += 1
            
            activity_timeline.append({
                "date": date_str,
                "count": count
            })
            
        return {
            "total_files": total_files,
            "total_vectors": total_messages * 4, # Proxy for now
            "total_sessions": total_sessions,
            "total_messages": total_messages,
            "activity_timeline": activity_timeline
        }

stats_service = StatsService()
