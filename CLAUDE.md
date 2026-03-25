# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CVLab is an AI-powered resume optimization platform. Users upload a resume, the system extracts text via OCR, runs a 3-prompt AI pipeline (Analyst → Gatherer → Craftsman), asks targeted follow-up questions, then generates an optimized resume. The frontend is Next.js 14 (App Router), the backend is FastAPI with Celery for background tasks.

## Architecture

```
Frontend (Next.js, port 8001)
    ↓ uploads file
Azure Blob Storage  ←→  Next.js API Route (/api/upload)
    ↓ notifies backend
Backend FastAPI (port 8002)
    ↓ queues task
Celery Worker  →  Redis (broker)
    ↓ uses
PostgreSQL (Supabase-hosted)  +  Anthropic/OpenAI APIs
```

### 3-Prompt Pipeline (in `backend/app/agents/`)
1. **Analyst** (`prompt1_analyst.py`) — Identifies CV ceiling/floor/delta
2. **Gatherer** (`prompt2_gatherer.py`) — Generates 10–25 targeted questions
3. **Craftsman** (`prompt3_craftsman.py`) — Builds optimized CV; ZERO FABRICATION rule

### Resume Status Flow
`UPLOADED → EXTRACTING → EXTRACTED → ANALYZING → ANALYZED → QUESTIONS_GENERATED → OPTIMIZING → OPTIMIZED / FAILED`

### Auth
- Frontend uses Supabase Auth (JWT); tokens forwarded to backend in `Authorization: Bearer` header
- Backend middleware (`backend/app/auth/middleware.py`) verifies JWT via Supabase
- Most user endpoints use `get_optional_user` — guest mode is enabled (no login required)
- Admin endpoints require admin role

### File Storage
- Files are uploaded from the browser to Azure Blob Storage via a Next.js API route (`app/api/upload/route.ts`)
- Backend downloads from Azure Blob using `backend/app/services/azure_blob_service.py`
- DB columns are still named `s3_key` / `s3_url` (legacy from S3 migration, functionally unchanged)

## Running with Docker (Production)

The app uses two separate docker-compose files that must both be running:

```bash
# Backend — uses docker-compose.prod.yml (NOT docker-compose.yml which is dev-only)
cd backend
docker-compose -f docker-compose.prod.yml up -d --build

# Frontend (from repo root)
docker-compose up -d --build
```

**Container names in production:**
| Container | Port | Image |
|-----------|------|-------|
| `cvlab-app` | 8001 | frontend |
| `cvlab_backend` | 8002→8000 | backend FastAPI |
| `cvlab_celery` | — | backend Celery worker |
| `cvlab_redis` | 6379 | redis:7-alpine |

**Environment files:**
- Frontend: `.env.production` (root) — consumed by root `docker-compose.yml` at build time
- Backend: `backend/.env.production` — loaded by `backend/docker-compose.prod.yml` via `env_file`; also auto-loaded by `config.py` at `backend.env.production` (repo root) when running locally

**Dev vs Prod compose:**
- `backend/docker-compose.yml` — dev only; runs local postgres on port 5432, maps backend to `8000:8000`, uses `backend/.env`
- `backend/docker-compose.prod.yml` — production; uses Supabase DB (external), maps backend to `8002:8000`, no `--reload`

## Local Development

### Frontend
```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
npm run lint
npm run typecheck
npm test             # vitest
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

pip install -r requirements.txt

# Start dependencies
docker-compose up -d postgres redis

# Run migrations
alembic upgrade head

# API server
uvicorn app.main:app --reload --port 8000

# Celery worker (separate terminal, same venv)
celery -A app.tasks.celery_app worker --loglevel=info
```

### Run a single test
```bash
npx vitest run __tests__/path/to/test.test.ts
```

### Database migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1
```

## Key Directories

| Path | Purpose |
|------|---------|
| `backend/app/agents/` | 3-prompt AI pipeline |
| `backend/app/tasks/` | Celery tasks (analysis, optimization) |
| `backend/app/services/azure_blob_service.py` | Azure Blob Storage (primary) |
| `backend/app/services/llm_handler.py` | Unified Claude/GPT-4o interface |
| `backend/app/services/ocr_service.py` | Text extraction via OpenAI Vision |
| `backend/prompts/` | Prompt template text files |
| `app/api/upload/route.ts` | Next.js Azure upload handler |
| `lib/parseResumeText.ts` | Frontend resume parser (markdown + plain text) |
| `contexts/` | React Auth + Language (i18n) contexts |
| `__tests__/` | Vitest tests (functional + visual regression) |

## Configuration Notes

- `backend/app/config.py` loads env in priority order: process env → `backend/.env` → `backend.env.production` (repo root)
- `USE_LANGGRAPH=true` in `backend.env.production` enables LangGraph mode; set to `false` to use plain Celery tasks
- CORS origins are hardcoded in `config.py` (production domains + localhost); update there if adding new origins
- Claude model is set via `CLAUDE_MODEL` env var; default is `claude-sonnet-4-5-20250929`
- API docs available at `http://localhost:8000/docs` (Swagger) and `/redoc`

## Frontend–Backend API Contract

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| POST | `/api/v1/upload` | optional | Direct file upload |
| POST | `/api/v1/upload-s3` | optional | Register Azure/S3 upload |
| GET | `/api/v1/status/{id}` | optional | Poll resume status |
| GET | `/api/v1/questions/{id}` | optional | Fetch generated questions |
| POST | `/api/v1/answers` | optional | Submit answers |
| GET | `/api/v1/preview/{id}` | optional | Get optimized resume JSON |
| GET | `/api/v1/download/{id}` | optional | Download optimized resume |
| GET/POST | `/api/admin/*` | admin role | Admin dashboard operations |
