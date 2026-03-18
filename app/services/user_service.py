from sqlalchemy.orm import Session
from app.repositories.user_repository import user_repository
from app.models.schemas import UserSettingsUpdate
from app.models.user import User

class UserService:
    def update_settings(self, db: Session, current_user: User, settings: UserSettingsUpdate) -> User:
        if settings.theme is not None:
            current_user.theme = settings.theme
        if settings.rag_config is not None:
            new_rag = dict(current_user.rag_config)
            new_rag.update(settings.rag_config)
            current_user.rag_config = new_rag
        if settings.chat_config is not None:
            new_chat = dict(current_user.chat_config)
            new_chat.update(settings.chat_config)
            current_user.chat_config = new_chat
            
        return user_repository.update(db, current_user)

user_service = UserService()
