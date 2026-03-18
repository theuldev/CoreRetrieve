from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest
from app.models.user import User
from app.core.agno_agent import get_agno_agent
from app.repositories.session_repository import session_repository
from agno.db.base import SessionType
import uuid

class ChatService:
    def process_chat(self, request: ChatRequest, current_user: User):
        provider = current_user.chat_config.get("provider", "gemini")
        model_name = current_user.chat_config.get("model", "gemini-2.0-flash")
        api_key_custom = current_user.chat_config.get("api_key", None)
        
        if request.session_id:
            if not request.session_id.startswith(f"{current_user.id}_"):
                actual_session_id = f"{current_user.id}_{request.session_id}"
            else:
                actual_session_id = request.session_id
        else:
            actual_session_id = f"{current_user.id}_{uuid.uuid4()}"

        existing_session = session_repository.get_session(actual_session_id, SessionType.AGENT)
        if not existing_session:
            all_sessions = session_repository.get_sessions(SessionType.AGENT)
            user_sessions = [s for s in all_sessions if s.session_id.startswith(f"{current_user.id}_")]
            if len(user_sessions) >= 5:
                raise HTTPException(status_code=403, detail="Limit of 5 active sessões alcançado. Apague uma sessão antiga para iniciar uma nova.")

        # Tratamento de erro de API Key faltando ou erro de configuracão da LLM
        try:
            agent = get_agno_agent(session_id=actual_session_id, provider=provider, model=model_name, api_key=api_key_custom if api_key_custom else None)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=f"Erro de configuração do provedor de IA: {str(ve)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno de IA: {str(e)}")

        if request.stream:
            try:
                # Retorna StreamingResponse direto
                return StreamingResponse(
                    agent.run(request.message, stream=True, session_id=actual_session_id),
                    media_type="text/event-stream"
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro de conexão com provedor de IA: {str(e)}")
        else:
            try:
                result = agent.run(request.message, stream=False, session_id=actual_session_id)
                if hasattr(result, 'content'):
                    full_response = result.content
                else:
                    full_response = str(result)
            except Exception as e:
                # Erro comum se não tem API KEY ou Rate Limit
                print(f"[Chat Error] {e}")
                raise HTTPException(status_code=500, detail=f"Ocorreu um erro ao comunicar com a IA (API Key inválida ou limite atingido). Detalhe: {str(e)}")

            return {
                "response": full_response,
                "session_id": actual_session_id.replace(f"{current_user.id}_", "") 
            }

chat_service = ChatService()
