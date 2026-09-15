"""Entry point del API — motor de dominio desacoplado del framework."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.mvp import router as mvp_router
from app.core.config import settings
from app.db import ping

app = FastAPI(
    title="UNAB EVM API",
    description="Motor EVM + persistencia MVP (Postgres/Supabase) — desarrollo local",
    version="0.3.0",
)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mvp_router)


@app.get("/health")
def health():
    db_ok = ping()
    return {
        "status": "ok" if db_ok else "degraded",
        "service": "unab-evm-api",
        "version": "0.3.0",
        "database": "up" if db_ok else "down",
    }
