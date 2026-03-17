
from pydantic import BaseModel
from typing import Optional, Any

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    stream: bool = False

class ChatResponse(BaseModel):
    response: str
    session_id: str
    metadata: Optional[dict[str, Any]] = None
