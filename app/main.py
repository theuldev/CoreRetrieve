from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse # Adicionado
from app.core.config import settings
from app.core.database import engine, Base
from app.api.routes import chat, sessions, auth, users, files, stats
from sqlalchemy import text
import os

Base.metadata.create_all(bind=engine)

def run_migrations():
    with engine.connect() as conn:
        try:
            conn.execute(text(
                "ALTER TABLE files ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'processed'"
            ))
            conn.commit()
        except Exception as e:
            print(f"[Migration] files.status: {e}")

run_migrations()

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
app.include_router(stats.router, prefix=settings.API_V1_STR + "/stats", tags=["stats"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
app.mount("/js", StaticFiles(directory="frontend/js"), name="js")
app.mount("/views", StaticFiles(directory="frontend/views"), name="views")
app.mount("/documents", StaticFiles(directory="frontend/documents"), name="documents")

@app.get("/{full_path:path}")
async def serve(full_path: str):
    clean_path = full_path.split('?')[0].strip("/")
    file_path = os.path.join("frontend", clean_path)

    if os.path.isfile(file_path):
        return FileResponse(file_path)

    if clean_path.startswith("api"):
        return {"detail": "Not Found"}, 404

    return FileResponse("frontend/index.html")