from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatRequest
from app.models.user import User
from app.core.agno_agent import get_agno_agent
from app.repositories.session_repository import session_repository
from agno.db.base import SessionType
from app.core.config import settings
from app.core.rag.manager import rag_manager
from app.core.rag.crag import CorrectiveRAG
from app.core.rag.basic import BasicRAG
from app.core.rag.hybrid import HybridRAG
import uuid

class ChatService:
    def __init__(self):
        self.strategies = {
            "crag": CorrectiveRAG(rag_manager),
            "basico": BasicRAG(rag_manager),
            "hibrido": HybridRAG(rag_manager)
        }

    def process_chat(self, request: ChatRequest, current_user: User):
        provider = current_user.chat_config.get("provider", "gemini")
        model_name = current_user.chat_config.get("model", "gemini-2.0-flash")
        api_key_custom = current_user.chat_config.get("api_key", None)
        rag_type = request.rag_type

        if not api_key_custom and not settings.GOOGLE_API_KEY:
            raise HTTPException(status_code=400, detail="É obrigatório fornecer uma API Key em suas configurações para utilizar o chat.")
        
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

        rag_config = current_user.rag_config.copy() if current_user.rag_config else {}
        if request.crag_provider:
            rag_config["crag_provider"] = request.crag_provider
        if request.crag_api_key:
            rag_config["crag_api_key"] = request.crag_api_key

        context = ""
        top_k = rag_config.get("top_k", 5)
        hybrid_enabled = rag_config.get("hybrid_search", True)
        rerank_enabled = rag_config.get("re_ranking", False)
        similarity_threshold = 0.75 if rag_config.get("similarity_filter", False) else 0.0
        
        rag_type = (request.rag_type or "basico").strip().lower()
        strategy = self.strategies.get(rag_type, self.strategies["basico"])
        
        try:
            print(f"[RAG] Strategy: {rag_type.upper()}")
            context = strategy.get_context(current_user.id, request.message, api_key_custom, top_k, rag_config=rag_config)
        except Exception as e:
            print(f"[RAG Error] {e}")
            context = ""

        prompt = f"{request.message}\n{context}" if context else request.message
        
        try:
            agent = get_agno_agent(session_id=actual_session_id, provider=provider, model=model_name, api_key=api_key_custom if api_key_custom else None)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=f"Erro de configuração do provedor de IA: {str(ve)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erro interno de IA: {str(e)}")

        if request.stream:
            try:
                return StreamingResponse(
                    agent.run(prompt, stream=True, session_id=actual_session_id),
                    media_type="text/event-stream"
                )
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Erro de conexão com provedor de IA: {str(e)}")
        else:
            try:
                result = agent.run(prompt, stream=False, session_id=actual_session_id)
                full_response = result.content if hasattr(result, 'content') else str(result)
                
                if not existing_session:
                    try:
                        new_title = request.message[:30] + ("..." if len(request.message) > 30 else "")
                        storage = getattr(agent, "session_storage", None) or \
                                  getattr(agent, "storage", None) or \
                                  getattr(agent, "db", None) or \
                                  (session_repository.db if hasattr(session_repository, "db") else None)
                        
                        if storage and hasattr(storage, "update_session"):
                            storage.update_session(actual_session_id, session_data={"title": new_title})
                        elif storage and hasattr(storage, "upsert_session"):
                            storage.upsert_session(actual_session_id, session_data={"title": new_title})
                    except Exception as e:
                        print(f"[Session Title Error] {e}")
            except Exception as e:
                print(f"[Chat Error] {e}")
                raise HTTPException(status_code=500, detail=f"Ocorreu um erro ao comunicar com a IA. Detalhe: {str(e)}")

            return {
                "response": full_response,
                "session_id": actual_session_id.replace(f"{current_user.id}_", "") 
            }

chat_service = ChatService()