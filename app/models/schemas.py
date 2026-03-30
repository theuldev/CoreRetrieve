from pydantic import BaseModel, EmailStr
from typing import Optional, Any, Dict, List

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
    rag_type: Optional[str] = None
    crag_provider: Optional[str] = None
    crag_api_key: Optional[str] = None
    
class ChatResponse(BaseModel):
    response: str
    session_id: str
    metadata: Optional[dict[str, Any]] = None

class MessageSchema(BaseModel):
    role: str
    content: str
    created_at: Optional[int] = None

class SessionSchema(BaseModel):
    id: str
    title: str
    created_at: Optional[int] = None
    updated_at: Optional[int] = None
    message_count: int = 0

class SessionDetailResponse(BaseModel):
    id: str
    title: str
    created_at: Optional[int] = None
    messages: List[MessageSchema]

class StatsResponse(BaseModel):
    total_files: int
    total_vectors: int
    total_sessions: int
    total_messages: int
    activity_timeline: List[Dict[str, Any]]

class FileResponse(BaseModel):
    model_config = {"from_attributes": True}
    id: int
    name: str
    size: int
    type: str
    created_at: int
    status: str = "processed"
