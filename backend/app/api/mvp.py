from fastapi import APIRouter, HTTPException

from app.core.config import settings
from app.db import fetch_snapshot, ping, upsert_snapshot

router = APIRouter(prefix="/api/v1/mvp", tags=["mvp"])


@router.get("/status")
def mvp_status():
    db_ok = ping()
    return {
        "ok": db_ok,
        "service": "unab-evm-api",
        "tenant_id": settings.mvp_tenant_id,
        "database": "up" if db_ok else "down",
    }


@router.get("/snapshot")
def get_snapshot():
    if not ping():
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    payload = fetch_snapshot(settings.mvp_tenant_id)
    if payload is None:
        raise HTTPException(status_code=404, detail="No hay snapshot MVP")
    return payload


@router.put("/snapshot")
def put_snapshot(payload: dict):
    if not ping():
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    tenant = payload.get("tenant") or {}
    tenant_id = tenant.get("id") or settings.mvp_tenant_id
    return upsert_snapshot(tenant_id, payload)
