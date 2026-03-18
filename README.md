# CoreRetrieve | Motor de Busca Semântica & RAG

O **CoreRetrieve** é uma plataforma de Recuperação Aumentada com Geração (RAG), projetada para permitir a consulta semântica e inteligente de documentos. O sistema suporta múltiplos pipelines de RAG (desde o básico até agentes autônomos) e integra-se com os principais provedores de LLM.

## 🚀 Funcionalidades

- **Múltiplos Modos de RAG**:
  - **Básico**: Busca por similaridade de embeddings.
  - **Híbrido**: Combinação de busca vetorial (semântica) e léxica (BM25).
  - **Re-ranking**: Recuperação inicial seguida de re-ordenação por relevância.
  - **Multi-query**: Geração de variações da pergunta para ampliar a cobertura semântica.
  - **Agêntico**: O modelo decide autonomamente as melhores estratégias de busca.
- **Gerenciamento de Documentos**: Upload de arquivos (suporte a .ZIP) e processamento automático.
- **Configuração Flexível**: Ajuste de tamanho de chunks, overlap e Top-K recuperados.
- **Suporte Multi-LLM**: Integração com Google Gemini, OpenAI e Anthropic Claude.
- **Interface Moderna**: UI responsiva com modo escuro, histórico de conversas e gerenciamento de memórias.

## 🛠️ Stack Tecnológica

- **Backend**: Python 3.12, FastAPI, SQLAlchemy (SQLite), Agno Framework.
- **Frontend**: HTML5, Tailwind CSS, JavaScript Vanilla, Lucide Icons, Marked.js.
- **IA/LLM**: Google Generative AI (Gemini), OpenAI, Anthropic.

## 📦 Estrutura do Projeto

- `app/`: Lógica do backend (API, rotas, modelos e serviços).
- `frontend/`: Interface do usuário e arquivos estáticos.
- `data/`: Armazenamento do banco de dados SQLite.
- `venv/`: Ambiente virtual Python (ignorado pelo Git).
- `.env`: Configuração de variáveis de ambiente e chaves de API.

## ⚙️ Instalação e Execução

### 1. Pré-requisitos
- Python 3.12+ instalado.

### 2. Configuração do Ambiente
Clone o repositório e acesse a pasta:
```bash
cd CoreRetrieve
```

Crie e ative o ambiente virtual:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python -m venv venv
source venv/bin/activate
```

Instale as dependências:
```bash
pip install -r requirements.txt
```

### 3. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com suas chaves de API:
```env
GOOGLE_API_KEY=sua_chave_aqui
AI_MODEL_NAME=gemini-2.0-flash
```

### 4. Executando a Aplicação
Inicie o servidor FastAPI:
```bash
uvicorn app.main:app --reload
```
A aplicação estará disponível em `http://localhost:8000`.

## 🔒 Segurança e Privacidade
O sistema implementa autenticação local e armazena os dados de sessão no banco de dados SQLite local. Documentos carregados permanecem no servidor local e as chaves de API são gerenciadas via variáveis de ambiente.

---
*Desenvolvido como um motor de busca semântica nativo, sem dependências de frameworks pesados de orquestração externa.*
