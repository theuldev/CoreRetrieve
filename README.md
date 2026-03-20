# CoreRetrieve | Motor de Busca Semântica & RAG (Docker & PgVector)

O **CoreRetrieve** é uma plataforma de Recuperação Aumentada com Geração (RAG) de alta performance, projetada para permitir a consulta semântica e inteligente de documentos. Esta versão foi migrada para uma arquitetura puramente baseada em **PostgreSQL** com a extensão **PgVector**, garantindo escalabilidade e robustez.

## 🚀 Funcionalidades

- **RAG Nativo com PgVector**: Implementação otimizada de busca vetorial utilizando o operador de distância de cosseno `<=>` do PostgreSQL.
- **Red/Black Theme**: Interface moderna e premium com paleta de cores em vermelho vibrante e modo escuro em preto absoluto.
- **Configuração de RAG Otimizada**: Processamento de documentos com `chunk_overlap: 0` para máxima clareza na recuperação.
- **Mandatory User API Keys**: Segurança aprimorada onde cada usuário fornece sua própria chave de API (Gemini, OpenAI, Anthropic) diretamente nas configurações da aplicação.
- **Containerização Total**: Dockerizado para fácil deploy e consistência em qualquer ambiente.
- **Suporte Multi-Documento**: Extração inteligente de textos de PDFs, DOCX, TXT e MD.

## 🛠️ Stack Tecnológica

- **Backend**: Python 3.12, FastAPI, SQLAlchemy, PostgreSQL + PgVector, Agno Framework.
- **Frontend**: HTML5, Vanilla JS, Lucide Icons, Marked.js.
- **IA/LLM**: Google Generative AI (Gemini), OpenAI, Anthropic (via Agno).
- **Infraestrutura**: Docker & Docker Compose.

## 📦 Estrutura do Projeto

- `app/`: Lógica do backend (API, rotas, modelos e serviços).
- `frontend/`: Interface do usuário, CSS (Red/Black) e JS (Relative API paths).
- `Dockerfile` & `docker-compose.yml`: Configurações de containerização.
- `requirements.txt`: Dependências otimizadas (removidas bibliotecas não utilizadas).

## ⚙️ Instalação e Execução (Docker - Recomendado)

### 1. Pré-requisitos
- Docker e Docker Compose instalados.

### 2. Executando a Aplicação
Clone o repositório e inicie os serviços:
```bash
docker compose up --build
```
Isso iniciará:
1. O banco de dados **Postgres** na porta `5432`.
2. A aplicação **FastAPI** na porta `8000`.

A aplicação estará disponível em `http://localhost:8000`.

### 3. Controle do Banco de Dados (pgAdmin)
O **pgAdmin 4** também está disponível para gerenciar o banco de dados via interface gráfica:
- **URL**: `http://localhost:5050`
- **Email**: `admin@admin.com`
- **Senha**: `admin`

Para conectar ao banco via pgAdmin, use o host `db` na porta `5432`.

## 🔑 Configuração de API Keys
Ao iniciar pela primeira vez:
1. Faça login na aplicação.
2. Acesse o menu de **Configurações**.
3. Insira sua chave de API (Gemini, OpenAI ou Anthropic).
4. A partir desse momento, você poderá fazer upload de arquivos e iniciar chats inteligentes.

> [!IMPORTANT]
> A aplicação não possui chaves de API padrão. É obrigatório que o usuário forneça sua própria chave para processamento de RAG e Chat.

## 🔒 Segurança e Privacidade
O sistema utiliza PostgreSQL para armazenamento persistente e seguro. Todas as chaves de API e documentos permanecem sob controle do usuário no ambiente de execução.

---
*Desenvolvido como um motor de busca semântica nativo e agêntico, otimizado para produção.*
