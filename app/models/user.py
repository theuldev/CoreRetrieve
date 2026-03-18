from sqlalchemy import Boolean, Column, Integer, String, JSON
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    
    theme = Column(String, default="dark")
    
    rag_config = Column(JSON, default=lambda: {
        "type": "basico",
        "chunk_size": 512,
        "chunk_overlap": 64,
        "top_k": 5
    })
    
    chat_config = Column(JSON, default=lambda: {
        "provider": "gemini",
        "model": "gemini-2.0-flash",
        "api_key": ""
    })
