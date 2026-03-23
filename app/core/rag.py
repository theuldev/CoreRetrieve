import os
import zipfile
import shutil
from typing import List
from pypdf import PdfReader
from docx import Document
from app.core.config import settings
from sqlalchemy import create_engine, text
from google import genai

class RagManager:
    def __init__(self):
        self.db_url = settings.DATABASE_URL
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
                            embedding vector(3072)
                        )
                    """))
                    conn.commit()
            except Exception as e:
                print(f"[RAG Init Error] {e}")

    def extract_text(self, file_path: str, is_internal: bool = False) -> str:
            ext = os.path.splitext(file_path)[1].lower()
            text_content = ""

            # Validação: O arquivo principal deve ser ZIP. 
            # Arquivos internos (is_internal=True) podem ser PDF, TXT, etc.
            if not is_internal and ext != ".zip":
                raise ValueError(f"Apenas arquivos .zip são aceitos. O arquivo {file_path} é inválido.")

            # --- Suporte aos arquivos dentro do ZIP ---
            if ext == ".pdf":
                try:
                    reader = PdfReader(file_path)
                    for page in reader.pages:
                        text_content += (page.extract_text() or "") + "\n"
                except Exception as e:
                    print(f"Erro ao ler PDF {file_path}: {e}")

            elif ext == ".docx":
                try:
                    doc = Document(file_path)
                    for para in doc.paragraphs:
                        text_content += para.text + "\n"
                except Exception as e:
                    print(f"Erro ao ler DOCX {file_path}: {e}")

            elif ext in [".txt", ".md"]:
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        text_content = f.read()
                except Exception as e:
                    print(f"Erro ao ler texto {file_path}: {e}")

            elif ext == ".zip":
                temp_dir = f"/tmp/extract_{os.path.basename(file_path)}"
                os.makedirs(temp_dir, exist_ok=True)
                
                try:
                    with zipfile.ZipFile(file_path, 'r') as z:
                        for member in z.namelist():
                            # Ignora arquivos inúteis e pastas
                            if member.startswith('__MACOSX/') or member.endswith('/') or member.startswith('.'):
                                continue
                            
                            z.extract(member, temp_dir)
                            full_member_path = os.path.join(temp_dir, member)
                            
                            if os.path.isfile(full_member_path):
                                # Chama recursivamente passando is_internal=True
                                text_content += self.extract_text(full_member_path, is_internal=True) + "\n"
                finally:
                    if os.path.exists(temp_dir):
                        shutil.rmtree(temp_dir)
            
            return text_content
    def chunk_text(self, text_input: str, chunk_size: int) -> List[str]:
        if not text_input or not text_input.strip():
            return []
        
        chunks = []
        for i in range(0, len(text_input), chunk_size):
            chunks.append(text_input[i:i + chunk_size])
        return chunks

    def get_embedding(self, text_input: str, api_key: str = None) -> List[float]:
        api_key = api_key or settings.GOOGLE_API_KEY
        client = genai.Client(api_key=api_key)
        
        try:
            result = client.models.embed_content(
                model="gemini-embedding-001",
                contents=text_input,
                config={'task_type': 'RETRIEVAL_DOCUMENT'}
            )
            return result.embeddings[0].values
        except Exception as e:
            print(f"Embedding error: {e}")
            return []

    def index_file(self, user_id: str, file_id: int, file_path: str, chunk_size: int = 512, api_key: str = None):
        text_content = self.extract_text(file_path)
        chunks = self.chunk_text(text_content, chunk_size)
        
        if not chunks:
            return

        engine = create_engine(self.db_url)
        try:
            with engine.begin() as conn:
                conn.execute(
                    text("DELETE FROM chunks WHERE file_id = :fid AND user_id = :uid"), 
                    {"fid": file_id, "uid": str(user_id)}
                )
                
                for chunk in chunks:
                    if not chunk.strip(): continue
                    embedding = self.get_embedding(chunk, api_key=api_key)
                    
                    if embedding:
                        conn.execute(
                            text("INSERT INTO chunks (file_id, user_id, content, embedding) VALUES (:fid, :uid, :content, CAST(:emb AS vector))"),
                            {
                                "fid": file_id, 
                                "uid": str(user_id), 
                                "content": chunk, 
                                "emb": str(embedding) 
                            }
                        )
        except Exception as e:
            print(f"[RAG Index DB Error] {e}")

    def retrieve(self, user_id: str, query: str, top_k: int = 5, api_key: str = None) -> List[str]:
        query_embedding = self.get_embedding(query, api_key=api_key)
        if not query_embedding: return []
        
        engine = create_engine(self.db_url)
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT content FROM chunks WHERE user_id = :uid ORDER BY embedding <=> CAST(:emb AS vector) LIMIT :k"),
                {"uid": str(user_id), "emb": str(query_embedding), "k": top_k}
            )
            return [row[0] for row in result]

rag_manager = RagManager()