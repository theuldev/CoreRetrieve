from app.core.config import settings
from app.core.rag.base import DocumentProcessor, VectorStore, EmbeddingProvider

class RagManager:
    def __init__(self):
        self.vector_store = VectorStore(settings.DATABASE_URL)
        self.processor = DocumentProcessor()

    def index_file(self, user_id: str, file_id: int, file_path: str, chunk_size: int = 512, api_key: str = None):
        embedder = EmbeddingProvider(api_key)
        text_content = self.processor.extract_text(file_path)
        chunks = self.processor.chunk_text(text_content, chunk_size)
        
        if not chunks:
            return

        self.vector_store.delete_file_chunks(user_id, file_id)
        
        for chunk in chunks:
            if not chunk.strip(): continue
            embedding = embedder.get_embedding(chunk)
            if embedding:
                self.vector_store.insert_chunk(user_id, file_id, chunk, embedding)

    def retrieve(self, user_id: str, query: str, top_k: int = 5, api_key: str = None, hybrid: bool = False, threshold: float = 0.0) -> list[str]:
        embedder = EmbeddingProvider(api_key)
        query_embedding = embedder.get_embedding(query)
        if not query_embedding:
            return []
        return self.vector_store.search_similar(user_id, query_embedding, top_k, query if hybrid else None, threshold=threshold)

rag_manager = RagManager()