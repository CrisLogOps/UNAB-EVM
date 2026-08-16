# Epic: Fundaciones MVP (post–Seminario 1)

**Label sugerido:** `epic` · `backend` · `W34`  
**No empezar código hasta cerrar la entrega del martes (Fase 1 propuesta / Seminario 1).**

## Objetivo

Dejar el repositorio **ejecutable de verdad** (no solo carpetas): API viva, schema mínimo, UI que confirme conexión.

## Alcance (sí)

- FastAPI `/health` + OpenAPI
- Migración SQL mínima multi-tenant
- Streamlit leyendo health
- Documentar `run_local` en 5 líneas

## Fuera de alcance (no)

- Candado F30 / retenciones
- PWA offline
- Motor EVM completo / Curva S final
- Integración SII
- Refactors grandes de docs

## Criterio de cierre del epic

Un compañero (o tú en máquina limpia) clona `Dev`, configura `.env`, levanta API + Streamlit y ve health en verde en &lt; 20 minutos.

## Hijos (crear como Issues separados o checklist)

- [ ] env-local
- [ ] api-skeleton
- [ ] schema-v0
- [ ] ui-health
- [ ] smoke-local

Ver seguimiento: Issue W34.
