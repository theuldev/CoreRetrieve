class HybridRAG:
    def __init__(self, rag_manager_instance):
        self.rag_manager = rag_manager_instance

    def get_context(self, user_id, message, api_key, top_k, rag_config=None):
        similarity_threshold = 0.0
        if rag_config and rag_config.get("similarity_filter", False):
            similarity_threshold = 0.75
            
        rerank_enabled = rag_config.get("re_ranking", False) if rag_config else False
        
        chunks = self.rag_manager.retrieve(
            user_id, 
            message, 
            top_k=top_k * 2 if rerank_enabled else top_k, 
            api_key=api_key,
            hybrid=True,
            threshold=similarity_threshold
        )
        
        if not chunks:
            return ""
            
        if rerank_enabled:
            chunks.sort(key=len, reverse=True)
            chunks = chunks[:top_k]
            
        return "\n\nCONTEXTO DOS SEUS DOCUMENTOS (RAG HÍBRIDO - VETOR + PALAVRA-CHAVE):\n" + "\n---\n".join(chunks)
