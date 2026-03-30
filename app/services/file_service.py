import os
import time
from typing import List
from sqlalchemy.orm import Session
from app.models.user import User, File
from app.core.rag.manager import rag_manager

class FileService:
    def save_file_metadata(self, db: Session, user: User, name: str, size: int, content_type: str) -> File:

        new_file = File(
            name=name,
            size=size,
            type=content_type,
            created_at=int(time.time()),
            user_id=user.id
        )
        db.add(new_file)
        db.commit()
        db.refresh(new_file)
        
        file_path = os.path.abspath(f"frontend/documents/{name}")
        
        try:
            rag_config = getattr(user, "rag_config", {}) or {}
            chat_config = getattr(user, "chat_config", {}) or {}
            api_key = chat_config.get("api_key")
            chunk_size = rag_config.get("chunk_size", 512)
            
            rag_manager.index_file(
                user_id=str(user.id), 
                file_id=new_file.id, 
                file_path=file_path, 
                chunk_size=chunk_size,
                api_key=api_key
            )
        except Exception:
            pass
            
        return new_file

    def list_files(self, db: Session, user: User) -> List[File]:
        return db.query(File).filter(File.user_id == user.id).order_by(File.created_at.desc()).all()

    def delete_file(self, db: Session, user: User, file_id: int) -> bool:
        file = db.query(File).filter(File.id == file_id, File.user_id == user.id).first()
        if file:
            try:
                rag_manager.vector_store.delete_file_chunks(user_id=str(user.id), file_id=file_id)
            except Exception:
                pass
            
            db.delete(file)
            db.commit()
            return True
        return False

file_service = FileService()