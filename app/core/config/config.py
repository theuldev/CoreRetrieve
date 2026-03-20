import os
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    PROJECT_NAME: str = "CoreRetrieve"
    API_V1_STR: str = "/api/v1"
    GOOGLE_API_KEY: Optional[str] = os.getenv("GOOGLE_API_KEY", None)
    AI_MODEL_NAME: str = os.getenv("AI_MODEL_NAME", "gemini-3.0-flash-preview")
    
    # Database
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL", None)
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]

    class Config:
        case_sensitive = True

settings = Settings()
