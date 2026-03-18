from pydantic import BaseModel, EmailStr
from typing import Optional, Any, Dict

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserSettingsUpdate(BaseModel):
    theme: Optional[str] = None
    rag_config: Optional[Dict[str, Any]] = None
    chat_config: Optional[Dict[str, Any]] = None

class UserResponse(BaseModel):
    id: str
    email: str
    theme: str
    rag_config: dict
    chat_config: dict

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    stream: bool = False
    
class ChatResponse(BaseModel):
    response: str
    session_id: str
    metadata: Optional[dict[str, Any]] = None

class SessionSchema(BaseModel):
    session_id: str
    title: str
    created_at: Optional[int] = None

class MessageSchema(BaseModel):
    role: str
    content: str
    created_at: Optional[int] = None
