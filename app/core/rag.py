import os
import numpy as np
import google.generativeai as genai
from typing import List, Dict, Any
from pypdf import PdfReader
from docx import Document
from app.core.config import settings
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

class RagManager:
    def __init__(self):
        self.db_url = settings.DATABASE_URL
        if not self.db_url or not self.db_url.startswith("postgresql"):
             pass
        self._init_db()

    def _init_db(self):
        if self.db_url and self.db_url.startswith("postgresql"):
            try:
                engine = create_engine(self.db_url)
                with engine.connect() as conn:
                    conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
                    conn.execute(text("""
                        CREATE TABLE IF NOT EXISTS chunks (
                            id SERIAL PRIMARY KEY,
                            file_id INTEGER,
                            user_id TEXT,
                            content TEXT,
                            embedding vector(768)
                        )
                    """))
                    conn.commit()
            except Exception as e:
                print(f"[RAG Init Error] {e}")

    def extract_text(self, file_path: str) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        text_content = ""
        if ext == ".pdf":
            reader = PdfReader(file_path)
            for page in reader.pages:
                text_content += page.extract_text() + "\n"
        elif ext == ".docx":
            doc = Document(file_path)
            for para in doc.paragraphs:
                text_content += para.text + "\n"
        elif ext in [".txt", ".md"]:
            with open(file_path, "r", encoding="utf-8") as f:
                text_content = f.read()
        return text_content

    def chunk_text(self, text_input: str, chunk_size: int, overlap: int = 0) -> List[str]:
        if not text_input:
            return []
        chunks = []
        for i in range(0, len(text_input), chunk_size):
            chunks.append(text_input[i:i + chunk_size])
        return chunks

    def get_embedding(self, text_input: str, api_key: str = None) -> List[float]:
        use_key = api_key or settings.GOOGLE_API_KEY
        if not use_key:
            raise ValueError("API Key é obrigatória para gerar embeddings.")
        
        try:
            genai.configure(api_key=use_key)
            result = genai.embed_content(
                model="models/embedding-001",
                content=text_input,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            print(f"Embedding error: {e}")
            return []

    def index_file(self, user_id: str, file_id: int, file_path: str, chunk_size: int = 512, api_key: str = None):
        text_content = self.extract_text(file_path)
        chunks = self.chunk_text(text_content, chunk_size, overlap=0)
        
        if not self.db_url or not self.db_url.startswith("postgresql"):
            print("[RAG Index Error] PostgreSQL database not configured.")
            return

        engine = create_engine(self.db_url)
        with engine.connect() as conn:
            conn.execute(text("DELETE FROM chunks WHERE file_id = :fid AND user_id = :uid"), {"fid": file_id, "uid": user_id})
            for chunk in chunks:
                if not chunk.strip(): continue
                embedding = self.get_embedding(chunk, api_key=api_key)
                if embedding:
                    conn.execute(
                        text("INSERT INTO chunks (file_id, user_id, content, embedding) VALUES (:fid, :uid, :content, :emb)"),
                        {"fid": file_id, "uid": user_id, "content": chunk, "emb": str(embedding)}
                    )
            conn.commit()

    def retrieve(self, user_id: str, query: str, top_k: int = 5, api_key: str = None) -> List[str]:
        query_embedding = self.get_embedding(query, api_key=api_key)
        if not query_embedding: return []
        
        if not self.db_url or not self.db_url.startswith("postgresql"):
            return []

        engine = create_engine(self.db_url)
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT content FROM chunks WHERE user_id = :uid ORDER BY embedding <=> :emb LIMIT :k"),
                {"uid": user_id, "emb": str(query_embedding), "k": top_k}
            )
            return [row[0] for row in result]

rag_manager = RagManager()
