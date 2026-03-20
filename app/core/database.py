from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

from app.core.config import settings

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL or ""

if not SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    raise RuntimeError("Somente o banco PostgreSQL é suportado. Verifique o seu DATABASE_URL.")

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
