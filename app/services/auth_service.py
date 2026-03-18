from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.repositories.user_repository import user_repository
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, SECRET_KEY, ALGORITHM
from app.models.schemas import UserCreate
from app.models.user import User
import uuid
from jose import jwt, JWTError

class AuthService:
    def register(self, db: Session, user_in: UserCreate) -> dict:
        user = user_repository.get_by_email(db, email=user_in.email)
        if user:
            raise HTTPException(
                status_code=400,
                detail="O usuário com esse email já existe."
            )
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash(user_in.password)
        
        new_user = User(
            id=user_id,
            email=user_in.email,
            hashed_password=hashed_password,
        )
        user_repository.create(db, new_user)
        
        access_token = create_access_token(data={"sub": new_user.id})
        refresh_token = create_refresh_token(data={"sub": new_user.id})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    def login(self, db: Session, username: str, password: str) -> dict:
        user = user_repository.get_by_email(db, email=username)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Email ou senha incorretos")
        elif not user.is_active:
            raise HTTPException(status_code=400, detail="Usuário inativo")
            
        access_token = create_access_token(data={"sub": user.id})
        refresh_token = create_refresh_token(data={"sub": user.id})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    def refresh_token(self, db: Session, refresh_token: str) -> dict:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception
            
        user = user_repository.get_by_id(db, user_id=user_id)
        if user is None:
            raise credentials_exception
            
        access_token = create_access_token(data={"sub": user.id})
        new_refresh_token = create_refresh_token(data={"sub": user.id})
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer"
        }

auth_service = AuthService()
