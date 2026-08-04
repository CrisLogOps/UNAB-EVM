"""Entry point provisional del API (scaffold Seminario 1)."""

from fastapi import FastAPI

app = FastAPI(
    title="UNAB EVM API",
    description="Motor EVM / Curva S / RBAC multi-tenant — MVP Seminario 1",
    version="0.1.0",
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "unab-evm-api", "version": "0.1.0"}
