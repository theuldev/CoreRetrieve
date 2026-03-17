# Saude de Luxo Chat-IA

Este projeto é um assistente virtual baseado em IA para clínicas de luxo, utilizando FastAPI e Docker.

## Pré-requisitos

- Docker
- Docker Compose

## Como rodar com Docker

Para iniciar a aplicação usando Docker, execute o seguinte comando na raiz do projeto (onde está o `docker-compose.yml`):

```bash
docker-compose up --build
```

A API estará disponível em `http://localhost:8000`.
A documentação interativa (Swagger UI) pode ser acessada em `http://localhost:8000/docs`.

## Estrutura do Projeto

- `app/`: Código fonte do backend (FastAPI)
- `Dockerfile`: Configuração da imagem Docker
- `docker-compose.yml`: Orquestração dos serviços
- `requirements.txt`: Dependências do Python

## Desenvolvimento Local (sem Docker)

1. Crie um ambiente virtual:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```

3. Execute o servidor:
   ```bash
   uvicorn app.main:app --reload
   ```
