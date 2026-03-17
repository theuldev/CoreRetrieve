import os
from typing import Dict, List, Optional, Union
import re

# Tentativa de importação de bibliotecas para leitura de documentos
try:
    from docx import Document
except ImportError:
    Document = None

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

# --- ESTADO DA SESSÃO (A "Memória" do Protocolo) ---
session_states: Dict[str, Dict] = {} 

def get_session_state(session_id: str) -> Dict:
    """
    Retorna ou inicializa o estado da sessão.
    Estrutura expandida para incluir o Briefing Visual.
    """
    if session_id not in session_states:
        session_states[session_id] = {
            # 1. Identidade e Autoridade (Agente Elena)
            "nome_medico": None,
            "especialidade": None,
            "missao_autoridade": None,
            "tempo_experiencia": None,

            # 2. Estrutura da Jornada (Agente Arquiteto)
            "fases": {
                "fase_1": None, 
                "fase_2": None, 
                "fase_3": None  
            },
            "tempo_total": None, 

            # 3. Gatilhos de Venda (Agente Impacto)
            "prognostico_nao_tratamento": None,
            "dor_paciente": None,

            # 4. Ancoragem Financeira (Agente Estrategista)
            "valor_avulso": None,
            "valor_protocolo": None,
            "bonus_inclusos": [],
            "gatilho_urgencia": None,
            
            # 5. Identidade Visual (Novo Agente Designer)
            "briefing_visual": {
                "estilo": "Minimalista", # Padrão
                "cores": "Preto e Branco",
                "formato": "Carrossel"
            },

            # Controle de Status
            "status": "EM_CONSTRUCAO"
        }
    return session_states[session_id]

def limpar_estado_sessao(session_id: str) -> None:
    if session_id in session_states:
        del session_states[session_id]

# --- HELPER: Formatação de Luxo ---
def formatar_moeda(valor: str) -> str:
    """Transforma entradas como '5000', '5k', '5000.00' em 'R$ 5.000,00'"""
    if not valor: return "Sob Consulta"
    
    # Remove caracteres não numéricos exceto ponto e vírgula
    limpo = re.sub(r'[^\d,.]', '', str(valor).lower().replace('k', '000'))
    
    try:
        # Tenta converter para float (assumindo ponto como decimal se houver)
        if ',' in limpo and '.' in limpo: # Formato brasileiro misturado
             limpo = limpo.replace('.', '').replace(',', '.')
        elif ',' in limpo: # Formato brasileiro puro
             limpo = limpo.replace(',', '.')
             
        numero = float(limpo)
        return f"R$ {numero:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except:
        return valor # Retorna original se falhar

# --- 1. FERRAMENTAS DE ARQUIVO ---

def criar_ferramenta_ler_documento(session_id: str):
    def ler_conteudo_arquivo(caminho_arquivo: str) -> str:
        """Lê arquivos PDF ou DOCX para extrair contexto."""
        if not os.path.exists(caminho_arquivo):
            return "ERRO: Arquivo não encontrado."

        texto_extraido = ""
        _, extensao = os.path.splitext(caminho_arquivo)
        extensao = extensao.lower()

        try:
            if extensao == ".docx":
                if Document is None: return "ERRO: Instale python-docx"
                doc = Document(caminho_arquivo)
                texto_extraido = "\n".join([para.text for para in doc.paragraphs])
            
            elif extensao == ".pdf":
                if PdfReader is None: return "ERRO: Instale pypdf"
                reader = PdfReader(caminho_arquivo)
                for page in reader.pages:
                    if page.extract_text():
                        texto_extraido += page.extract_text() + "\n"
            else:
                return "ERRO: Formato não suportado (apenas .pdf ou .docx)."

            return f"CONTEÚDO DO ARQUIVO:\n{texto_extraido[:50000]}"

        except Exception as e:
            return f"ERRO CRÍTICO: {str(e)}"

    return ler_conteudo_arquivo
