# Backend — API REST + Motor EVM

Stack objetivo Fase 1: **Python + FastAPI**.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Módulos previstos:

| Ruta | Responsabilidad |
|------|-----------------|
| `app/api/` | Routers REST |
| `app/core/` | Config, auth, contexto de tenant |
| `app/domain/` | Reglas: candado EV, freeze/replan |
| `app/services/` | Motor EVM, pipeline CSV, RBAC |
| `app/repositories/` | Acceso a PostgreSQL / Supabase |
| `app/schemas/` | Modelos Pydantic |
