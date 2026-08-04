# Arquitectura — ADRs (borrador)

Documento vivo para registrar decisiones arquitectónicas del MVP.

## ADR-001 — Stack Fase 1

- **Estado:** Aceptado (Seminario 1)
- **Decisión:** Supabase (PostgreSQL) + FastAPI + Streamlit + deploy freemium (Render / Streamlit Cloud)
- **Alternativas:** Flask, Dash, hosting propio
- **Consecuencia:** Tradeoff formal en Seminario 2

## ADR-002 — Multi-tenancy lógico

- **Estado:** Aceptado
- **Decisión:** Aislamiento por `tenant_id` en PostgreSQL; RLS opcional en Supabase
- **Consecuencia:** Owner/CEO parametriza áreas y RBAC por organización
