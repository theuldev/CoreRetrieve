from typing import List
from google import genai
from sqlalchemy import create_engine, text
from app.core.config import settings
import os
import zipfile
import shutil
from pypdf import PdfReader
from docx import Document

class DocumentProcessor:
    @staticmethod
    def extract_text(file_path: str, is_internal: bool = False) -> str:
        ext = os.path.splitext(file_path)[1].lower()
        text_content = ""
        
        if not is_internal and ext not in [".pdf", ".docx", ".txt", ".md", ".zip"]:
            raise ValueError(f"Extensão inválida: {ext}")

        if ext == ".pdf":
            try:
                reader = PdfReader(file_path)
                for page in reader.pages:
                    text_content += (page.extract_text() or "") + "\n"
            except Exception:
                pass

        elif ext == ".docx":
            try:
                doc = Document(file_path)
                for para in doc.paragraphs:
                    text_content += para.text + "\n"
            except Exception:
                pass

        elif ext in [".txt", ".md"]:
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text_content = f.read()
            except Exception:
                pass

        elif ext == ".zip":
            temp_dir = f"/tmp/extract_{os.path.basename(file_path)}"
            os.makedirs(temp_dir, exist_ok=True)
            try:
                with zipfile.ZipFile(file_path, 'r') as z:
                    for member in z.namelist():
                        if member.startswith('__MACOSX/') or member.endswith('/') or member.startswith('.'):
                            continue
                        z.extract(member, temp_dir)
                        full_member_path = os.path.join(temp_dir, member)
                        if os.path.isfile(full_member_path):
                            text_content += DocumentProcessor.extract_text(full_member_path, is_internal=True) + "\n"
            finally:
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir)
        
        return text_content

    @staticmethod
    def chunk_text(text_input: str, chunk_size: int) -> List[str]:
        if not text_input or not text_input.strip():
            return []
        return [text_input[i:i + chunk_size] for i in range(0, len(text_input), chunk_size)]

class EmbeddingProvider:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or settings.GOOGLE_API_KEY
        self.client = genai.Client(api_key=self.api_key)

    def get_embedding(self, text_input: str) -> List[float]:
        try:
            result = self.client.models.embed_content(
                model="gemini-embedding-001",
                contents=text_input,
                config={'task_type': 'RETRIEVAL_DOCUMENT'}
            )
            return result.embeddings[0].values
        except Exception:
            return []

class VectorStore:
    def __init__(self, db_url: str):
        self.engine = create_engine(db_url)

    def delete_file_chunks(self, user_id: str, file_id: int):
        with self.engine.begin() as conn:
            conn.execute(
                text("DELETE FROM chunks WHERE file_id = :fid AND user_id = :uid"),
                {"fid": file_id, "uid": str(user_id)}
            )

    def insert_chunk(self, user_id: str, file_id: int, content: str, embedding: List[float]):
        with self.engine.begin() as conn:
            conn.execute(
                text("INSERT INTO chunks (file_id, user_id, content, embedding) VALUES (:fid, :uid, :content, CAST(:emb AS vector))"),
                {
                    "fid": file_id,
                    "uid": str(user_id),
                    "content": content,
                    "emb": str(embedding)
                }
            )

    def search_similar(self, user_id: str, embedding: List[float], top_k: int, query_text: str = None, threshold: float = 0.0) -> List[str]:
        with self.engine.connect() as conn:
            if query_text:
                # Hybrid search: Vector Similarity (70%) + Full Text Search (30%)
                stmt = text("""
                    SELECT content 
                    FROM chunks 
                    WHERE user_id = :uid 
                    AND (1 - (embedding <=> CAST(:emb AS vector))) >= :thr
                    ORDER BY (
                        0.7 * (1 - (embedding <=> CAST(:emb AS vector))) + 
                        0.3 * ts_rank_cd(to_tsvector('portuguese', content), plainto_tsquery('portuguese', :q))
                    ) DESC 
                    LIMIT :k
                """)
                result = conn.execute(stmt, {"uid": str(user_id), "emb": str(embedding), "q": query_text, "k": top_k, "thr": threshold})
            else:
                # Pure Vector Search (Default)
                stmt = text("""
                    SELECT content 
                    FROM chunks 
                    WHERE user_id = :uid 
                    AND (1 - (embedding <=> CAST(:emb AS vector))) >= :thr
                    ORDER BY embedding <=> CAST(:emb AS vector) 
                    LIMIT :k
                """)
                result = conn.execute(stmt, {"uid": str(user_id), "emb": str(embedding), "k": top_k, "thr": threshold})
            
            return [row[0] for row in result]