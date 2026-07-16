from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import auth, family, games, leaderboard, progress, users
from .core.config import settings
from .db import Base, engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Dev convenience; production uses Alembic migrations.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    lifespan=lifespan,
    title=settings.app_name,
    version="1.0.0",
    description="API for ChessMaster Academy — an AI-powered personal chess coach.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_V1 = "/api/v1"
for router in (auth.router, users.router, progress.router, games.router, family.router, leaderboard.router):
    app.include_router(router, prefix=API_V1)


@app.get("/healthz", tags=["ops"])
def healthz():
    return {"status": "ok"}
