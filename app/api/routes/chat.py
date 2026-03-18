from fastapi import APIRouter, Depends
from app.models.schemas import ChatRequest, ChatResponse
from app.models.user import User
from app.api import deps
from app.services.chat_service import chat_service

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: User = Depends(deps.get_current_user)
):
    """
    Chat endpoint.
    If stream=True, returns a streaming response.
    Otherwise, returns a JSON response.
    """
    return chat_service.process_chat(request, current_user)
