from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.models.schemas import FileResponse
from app.models.user import User
from app.api import deps
from app.services.file_service import file_service
import os

router = APIRouter()

@router.post("/upload", response_model=FileResponse)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    upload_dir = "frontend/documents"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, file.filename)
    
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao salvar arquivo: {str(e)}")

    return file_service.save_file_metadata(
        db, current_user, file.filename, len(content), file.content_type or "application/octet-stream"
    )

@router.get("", response_model=List[FileResponse])
async def list_files(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    return file_service.list_files(db, current_user)

@router.delete("/{file_id}")
async def delete_file(
    file_id: int,
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_user)
):
    success = file_service.delete_file(db, current_user, file_id)
    if not success:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    return {"message": "Arquivo excluído com sucesso"}
