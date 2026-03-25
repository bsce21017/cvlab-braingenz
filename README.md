# CVLab / ResumeAI

AI-powered resume optimization platform with a 3-prompt pipeline architecture. Built with Next.js (frontend) and FastAPI (backend).

## Tech Stack

### Frontend
- Next.js 14 (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- Supabase Auth (email/password + Google OAuth)
- Azure Blob Storage for file uploads

### Backend
- FastAPI (Python 3.11+), PostgreSQL + SQLAlchemy, Alembic
- Celery + Redis for background task processing
- Claude (Anthropic) primary LLM, OpenAI GPT-4o for OCR
- Azure Blob Storage

---

## Docker Setup (Recommended)

Two separate docker-compose files must both be running.

### Prerequisites
- Docker Desktop installed and running
- Fill in credentials in `backend/.env` and `.env` (see [Environment Variables](#environment-variables))

### 1. Start the Backend

```bash
cd backend

# Development (local PostgreSQL + Redis, backend on port 8000)
docker-compose up -d --build

# Production (Supabase DB, backend on port 8002)
docker-compose -f docker-compose.prod.yml up -d --build
```

First time only — run migrations:
```bash
docker exec cv_build_backend alembic upgrade head
```

### 2. Start the Frontend

```bash
# From repo root
docker-compose up -d --build
```

### Container Overview

| Container | Port | Compose file |
|-----------|------|-------------|
| `cvlab-app` | 8001 | root `docker-compose.yml` |
| `cvlab_backend` / `cv_build_backend` | 8002 / 8000 | `backend/docker-compose.prod.yml` / `backend/docker-compose.yml` |
| `cvlab_celery` / `cv_build_celery_worker` | — | backend compose |
| `cvlab_redis` / `cv_build_redis` | 6379 | backend compose |

> **Note:** Dev compose uses local PostgreSQL. Prod compose uses Supabase (external DB, no local postgres container).

### Health Check

```bash
# Backend
curl http://localhost:8000/health   # dev
curl http://localhost:8002/health   # prod

# Swagger UI
open http://localhost:8000/docs
```

### Viewing Logs

```bash
cd backend

# All services
docker-compose logs -f

# Celery worker only (most useful for debugging the AI pipeline)
docker-compose logs -f celery_worker

# Backend API only
docker-compose logs -f backend
```

### Stop Everything

```bash
cd backend && docker-compose down
# From repo root
docker-compose down
```

---

## Local Development (without Docker)

### Frontend

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint
npm run typecheck
npm test           # vitest
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt

# Start dependencies only
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# API server
uvicorn app.main:app --reload --port 8000

# Celery worker (separate terminal)
celery -A app.tasks.celery_app worker --loglevel=info --pool=solo
```

> **Important:** Always use `--pool=solo` for the Celery worker in local/Docker development. The default prefork pool hangs silently in WSL2/Docker environments.

---

## Environment Variables

### Frontend (`.env`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Azure Blob Storage (for file uploads)
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_ACCOUNT_NAME=your-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-account-key
AZURE_CONTAINER_NAME=resumes

NEXT_PUBLIC_UPLOAD_API_URL=/api/upload
```

### Backend (`backend/.env`)

```env
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENAI_API_KEY=sk-proj-xxxxx

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cv_build
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_ACCOUNT_NAME=your-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-account-key
AZURE_CONTAINER_NAME=resumes

DEFAULT_LLM_PROVIDER=claude
CLAUDE_MODEL=claude-sonnet-4-20250514
USE_LANGGRAPH=false
DEBUG=True
```

---

## Database Migrations

```bash
cd backend

# Apply all pending migrations
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "description"

# Roll back one migration
alembic downgrade -1
```

---

## API Endpoints

### User API (`/api/v1/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Direct file upload |
| POST | `/upload-s3` | Register Azure/S3 upload |
| GET | `/status/{id}` | Poll resume processing status |
| GET | `/questions/{id}` | Get generated questions |
| POST | `/answers` | Submit user answers |
| GET | `/preview/{id}` | Get optimized resume (JSON) |
| GET | `/download/{id}` | Download optimized resume |

### Resume Status Flow

```
UPLOADED → EXTRACTING → EXTRACTED → ANALYZING → ANALYZED
→ QUESTIONS_GENERATED → OPTIMIZING → OPTIMIZED / FAILED
```

### Admin API (`/api/admin/`) — requires admin role

Users, resumes, prompts, LLM config, claims management.

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with upload |
| `/processing` | Real-time processing status |
| `/questions` | Q&A flow |
| `/resume-preview` | Template selection & preview |
| `/admin/overview` | Admin dashboard |
| `/admin/resumes` | Resume management |
| `/admin/users` | User management |
| `/admin/prompts` | Prompt management |

---

## Production Deployment

```bash
# Backend (Supabase DB, port 8002)
cd backend
docker-compose -f docker-compose.prod.yml up -d --build

# Frontend (port 8001)
# From repo root
docker-compose up -d --build
```

---

## License

Proprietary — All rights reserved.
