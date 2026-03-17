
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest, ChatResponse
from app.core.agno_agent import get_agno_agent
from typing import Generator
import json

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint.
    If stream=True, returns a streaming response.
    Otherwise, returns a JSON response.
    """
    agent = get_agno_agent(session_id=request.session_id)
    
    from app.core.agno_agent import db
    from agno.db.base import SessionType
    
    existing_session = db.get_session(request.session_id, SessionType.TEAM)
    if not existing_session:
        all_sessions = db.get_sessions(SessionType.TEAM)
        if len(all_sessions) >= 5:
            raise HTTPException(status_code=403, detail="Limit of 5 active sessions reached. Please delete an old session to start a new one.")

    
    if request.stream:
        return StreamingResponse(
            agent.run(request.message, stream=True),
            media_type="text/event-stream"
        )
    else:
        try:
            result = agent.run(request.message, stream=False, session_id=request.session_id)
            if hasattr(result, 'content'):
                full_response = result.content
            else:
                full_response = str(result)
        except Exception as e:
            full_response = f"Erro ao processar mensagem: {str(e)}"

        return ChatResponse(
            response=full_response,
            session_id=request.session_id or "new_session"
        )
