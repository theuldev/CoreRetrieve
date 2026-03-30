import requests
from google import genai
from app.core.config import settings

class CorrectiveRAG:
    def __init__(self, rag_manager):
        self.rag_manager = rag_manager

    def _evaluate_relevance(self, query, chunks, api_key):
        if not chunks:
            return "incorrect"
        
        # Use fallback if api_key is not provided
        effective_key = api_key or settings.GOOGLE_API_KEY
        if not effective_key:
            print("[CRAG] Error: No Google API Key available for evaluation.")
            return "ambiguous"

        try:
            client = genai.Client(api_key=effective_key)
            
            context_text = "\n".join(chunks)
            prompt = f"""
            Avalie se os documentos abaixo são úteis para responder à pergunta: "{query}"
            Responda apenas com uma das palavras: "correct", "ambiguous" ou "incorrect".
            
            Documentos:
            {context_text}
            """
            
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt
            )
            score = response.text.strip().lower()
            return score if score in ["correct", "ambiguous", "incorrect"] else "ambiguous"
        except Exception as e:
            print(f"[CRAG Evaluation Error] {str(e)}")
            return "ambiguous"

    def _search_google(self, query, api_key):
        if "|" in api_key:
            k, cx = api_key.split("|")
        else:
            return "Erro: Formato da chave Google Search inválido. Use 'API_KEY|CSE_ID'."

        url = f"https://www.googleapis.com/customsearch/v1?q={query}&key={k}&cx={cx}"
        try:
            res = requests.get(url, timeout=10)
            data = res.json()
            items = data.get("items", [])
            results = []
            for item in items[:3]:
                results.append(f"Título: {item['title']}\nSnippets: {item['snippet']}\nLink: {item['link']}")
            return "\n\n".join(results) or "Nenhum resultado encontrado no Google."
        except Exception as e:
            return f"Erro na busca Google: {str(e)}"

    def _search_tavily(self, query, api_key):
        url = "https://api.tavily.com/search"
        payload = {
            "api_key": api_key,
            "query": query,
            "search_depth": "basic",
            "max_results": 3
        }
        try:
            res = requests.post(url, json=payload, timeout=10)
            data = res.json()
            results = []
            for result in data.get("results", []):
                results.append(f"Título: {result['title']}\nConteúdo: {result['content']}\nLink: {result['url']}")
            return "\n\n".join(results) or "Nenhum resultado encontrado no Tavily."
        except Exception as e:
            return f"Erro na busca Tavily: {str(e)}"

    def get_context(self, user_id, message, api_key, top_k, rag_config=None):
        hybrid_enabled = rag_config.get("hybrid_search", False) if rag_config else False
        similarity_threshold = 0.75 if rag_config and rag_config.get("similarity_filter", False) else 0.0
        
        chunks = self.rag_manager.retrieve(
            user_id, 
            message, 
            top_k=top_k, 
            api_key=api_key, 
            hybrid=hybrid_enabled, 
            threshold=similarity_threshold
        )
        
        status = self._evaluate_relevance(message, chunks, api_key)
        
        if status == "correct":
            return "\n\nCONTEXTO VERIFICADO:\n" + "\n---\n".join(chunks)
        
        elif status == "incorrect":
            if rag_config and "crag_provider" in rag_config:
                provider = rag_config.get("crag_provider")
                crag_key = rag_config.get("crag_api_key")
                
                if not crag_key:
                    return "O sistema identificou que os documentos internos não possuem essa informação e nenhuma chave de API CRAG foi configurada."
                
                if provider == "google":
                    web_results = self._search_google(message, crag_key)
                elif provider == "tavily":
                    web_results = self._search_tavily(message, crag_key)
                else:
                    return "Provedor CRAG desconhecido."
                print(f"\n\nCONTEXTO OBTIDO VIA BUSCA WEB ({provider.upper()}):\n{web_results}")
                return f"\n\nCONTEXTO OBTIDO VIA BUSCA WEB ({provider.upper()}):\n{web_results}"
            
            return "O sistema identificou que os documentos internos não possuem essa informação e o CRAG não está totalmente configurado."
            
        else:
            return "\n\nCONTEXTO PARCIAL (Pode estar incompleto):\n" + "\n---\n".join(chunks)

