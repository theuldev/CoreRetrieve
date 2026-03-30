from app.core.rag.manager import rag_manager

class BasicRAG:
    def __init__(self, rag_manager_instance):
        self.rag_manager = rag_manager_instance

    def get_context(self, user_id, message, api_key, top_k, rag_config=None):
        similarity_threshold = 0.0
        if rag_config and rag_config.get("similarity_filter", False):
            similarity_threshold = 0.75
            
        chunks = self.rag_manager.retrieve(
            user_id, 
            message, 
            top_k=top_k, 
            api_key=api_key,
            hybrid=False,
            threshold=similarity_threshold
        )
        
        if not chunks:
            return ""
            
        return "\n\nCONTEXTO DOS SEUS DOCUMENTOS (RAG BÁSICO):\n" + "\n---\n".join(chunks)
