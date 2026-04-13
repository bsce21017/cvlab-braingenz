# Project Guidelines

## Primary References
- Treat [CLAUDE.md](CLAUDE.md) as the canonical architecture and workflow reference for this repository.
- Use [README.md](README.md) for root setup and common commands.
- Use [backend/README.md](backend/README.md) for backend-specific details.
- For deployment and cloud migration details, link to [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md), [AZURE_MIGRATION_GUIDE.md](AZURE_MIGRATION_GUIDE.md), and [MIGRATION_STATUS.md](MIGRATION_STATUS.md) instead of duplicating their content.

## Architecture
- Frontend is Next.js App Router in [app/](app/) and shared UI in [components/](components/).
- Backend is FastAPI in [backend/app/](backend/app/) with Celery tasks in [backend/app/tasks/](backend/app/tasks/) and AI pipeline agents in [backend/app/agents/](backend/app/agents/).
- File upload flow: Next.js API route in [app/api/upload/route.ts](app/api/upload/route.ts) uploads to Azure Blob, backend then processes metadata and workflow.
- Resume pipeline status flow and agent responsibilities are documented in [CLAUDE.md](CLAUDE.md).

## Build And Test
- Frontend (repo root):
  - npm run dev
  - npm run build
  - npm run lint
  - npm run typecheck
  - npm test
- Backend local development (from [backend/](backend/)):
  - pip install -r requirements.txt
  - docker-compose up -d postgres redis
  - alembic upgrade head
  - uvicorn app.main:app --reload --port 8000
  - celery -A app.tasks.celery_app worker --loglevel=info --pool=solo
- Docker workflows:
  - Root docker-compose.yml runs frontend container.
  - [backend/docker-compose.yml](backend/docker-compose.yml) is development.
  - [backend/docker-compose.prod.yml](backend/docker-compose.prod.yml) is production-like.

## Project Conventions
- Authentication is custom JWT-based; avoid reintroducing Supabase auth flows unless explicitly requested.
- Many user endpoints support guest mode; admin endpoints require admin role enforcement.
- Azure Blob Storage is the active storage backend; legacy column names like s3_key and s3_url may still appear in DB models.
- In local and Docker development, Celery worker should run with --pool=solo to avoid hangs.
- Backend configuration loading and CORS behavior are centralized in [backend/app/config.py](backend/app/config.py); update there when behavior changes.
- Prefer focused, minimal changes and preserve existing patterns in nearby code.

## Documentation-First Rule
- Before implementing non-trivial changes, check whether relevant guidance already exists in:
  - [CLAUDE.md](CLAUDE.md)
  - [README.md](README.md)
  - [backend/README.md](backend/README.md)
  - [docs/AUTH_PAYMENT_GATE_RESTORE_CHECKLIST.md](docs/AUTH_PAYMENT_GATE_RESTORE_CHECKLIST.md)
- Link to those docs in explanations instead of copying large sections into code comments or new docs.