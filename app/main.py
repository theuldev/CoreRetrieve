
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.api.routes import chat, sessions
import os

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

os.makedirs("frontend/documents", exist_ok=True)

app.include_router(chat.router, prefix=settings.API_V1_STR + "/chat", tags=["chat"])
app.include_router(sessions.router, prefix=settings.API_V1_STR + "/sessions", tags=["sessions"])

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "CoreRetrieve API is running",
        "ai_model": settings.AI_MODEL_NAME
    }

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
