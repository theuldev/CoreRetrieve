from agno.agent import Agent
from agno.db.postgres import PostgresDb
from app.core.config import settings

import logging
from textwrap import dedent
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Using PostgreSQL for session storage
db = None
if settings.DATABASE_URL:
    db = PostgresDb(session_table="agno_sessions", db_url=settings.DATABASE_URL)

def get_llm_model(provider: str, model_id: str, api_key: str = None):
    """Instantiates the correct Agno model class based on provider and model ID."""
    provider = provider.lower()
    
    if provider == "openai":
        from agno.models.openai import OpenAIChat
        key = api_key or getattr(settings, "OPENAI_API_KEY", None)
        return OpenAIChat(id=model_id, api_key=key)
        
    elif provider == "claude" or provider == "anthropic":
        from agno.models.anthropic import Claude
        key = api_key or getattr(settings, "ANTHROPIC_API_KEY", None)
        return Claude(id=model_id, api_key=key)
        
    from agno.models.google import Gemini
    key = api_key or getattr(settings, "GOOGLE_API_KEY", None)
    return Gemini(id=model_id, api_key=key)

def get_agno_agent(session_id: str = None, provider: str = "gemini", model: str = "gemini-2.0-flash", api_key: str = None) -> Agent:
    """Returns a simple generalized RAG assistant agent."""
    
    llm = get_llm_model(provider, model, api_key)
    
    return Agent(
        name="CoreRetrieve Assistant",
        model=llm,
        db=db if db else None,
        add_history_to_context=True,
        num_history_runs=30,
        instructions=dedent("""\
            Você é um assistente RAG nativo em desenvolvimento.
            Sua missão é ajudar o usuário de forma concisa, clara e técnica quando apropriado.
            
            [Regras]
            - Seja direto nas respostas.
            - Caso você receba trechos de documentos (chunks de RAG), baseie sua resposta unicamente nesses trechos.
            - Se a resposta não estiver no contexto fornecido, admita que não sabe.
            - O sistema está em desenvolvimento, então explique que o módulo RAG será implementado pelo usuário caso perguntem sobre ferramentas.
        """),
        markdown=True
    )

def clear_all_team_cache():
    """Limpa banco de dados de sessoes (opcional)."""
    pass

def remove_team_from_cache(session_id: str):
    pass
