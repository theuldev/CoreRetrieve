import os
import time
from typing import List
from sqlalchemy.orm import Session
from app.models.user import User, File
from app.models.schemas import FileResponse

from app.core.rag import rag_manager

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
        file_path = f"frontend/documents/{name}"
        try:
            api_key = user.rag_config.get("api_key")
            rag_manager.index_file(
                user.id, 
                new_file.id, 
                file_path, 
                chunk_size=user.rag_config.get("chunk_size", 512),
                api_key=api_key
            )
        except Exception as e:
            print(f"RAG Indexing Error: {e}")
            
        return new_file

    def list_files(self, db: Session, user: User) -> List[File]:
        return db.query(File).filter(File.user_id == user.id).order_by(File.created_at.desc()).all()

    def delete_file(self, db: Session, user: User, file_id: int) -> bool:
        file = db.query(File).filter(File.id == file_id, File.user_id == user.id).first()
        if file:
            db.delete(file)
            db.commit()
            return True
        return False

file_service = FileService()
