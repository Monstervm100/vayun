# ChessMaster Academy — Deployment Guide

## Local development (no Docker)

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:3000
```
The app runs fully in guest mode with local persistence — no backend required.

### Backend (optional for auth/sync)
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows  (source .venv/bin/activate on mac/linux)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- Swagger docs: http://localhost:8000/docs
- Dev database: SQLite file `backend/chessmaster.db` (auto-created)
- Point the frontend at it with `frontend/.env.local`:
  `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`

### Backend tests
```bash
cd backend
pytest
```

## Docker (full stack)

```bash
docker compose up --build
```

Services:
| Service | Port | Notes |
|---|---|---|
| `web` (Next.js standalone) | 3000 | `NEXT_PUBLIC_API_URL` baked at build |
| `api` (FastAPI/uvicorn) | 8000 | `DATABASE_URL=postgresql+psycopg://…` |
| `db` (postgres:16-alpine) | 5432 | volume `pgdata` |
| `redis` (redis:7-alpine) | 6379 | rate limiting / cache |

## Environment variables

### Backend (`backend/.env`)
| Var | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./chessmaster.db` | SQLAlchemy URL; use postgres in prod |
| `SECRET_KEY` | dev value — **change in prod** | JWT signing |
| `ACCESS_TOKEN_MINUTES` | `15` | Access token TTL |
| `REFRESH_TOKEN_DAYS` | `30` | Refresh token TTL |
| `GOOGLE_CLIENT_ID` | — | Verify Google ID tokens |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated |
| `REDIS_URL` | — (optional) | Enables rate limiting |

### Frontend (`frontend/.env.local`)
| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend base URL; omit for pure guest mode |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in button |

## Production checklist

- [ ] Generate a strong `SECRET_KEY`; switch JWT to RS256 with rotated keys
- [ ] Managed PostgreSQL with automated backups; run `alembic upgrade head`
- [ ] HTTPS termination (nginx/Caddy/cloud LB); HSTS
- [ ] Set exact `CORS_ORIGINS`
- [ ] Enable Redis rate limiting on `/auth/*` and `/progress/sync`
- [ ] Serve `/public/engine/*.wasm` with `Content-Type: application/wasm` and long cache
- [ ] Error tracking (Sentry) + structured logs
- [ ] CI gate: lint, typecheck, `pytest`, `npm run build`
