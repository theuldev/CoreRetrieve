from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import chat, sessions, auth, users, files
import os

# Create DB tables
Base.metadata.create_all(bind=engine)

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

app.include_router(auth.router, prefix=settings.API_V1_STR + "/auth", tags=["auth"])
app.include_router(users.router, prefix=settings.API_V1_STR + "/users", tags=["users"])
app.include_router(chat.router, prefix=settings.API_V1_STR + "/chat", tags=["chat"])
app.include_router(sessions.router, prefix=settings.API_V1_STR + "/sessions", tags=["sessions"])
app.include_router(files.router, prefix=settings.API_V1_STR + "/files", tags=["files"])

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "message": "CoreRetrieve API is running",
        "ai_model": settings.AI_MODEL_NAME
    }

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
