# [Semana 2026.W34] Seguimiento semanal — arranque desarrollo MVP

**Crear después del martes de entrega Fase 1 (Seminario 1).**  
Hasta ese martes: no ejecutar las tareas de código de este Issue.

## Metadatos

- **Semana ISO:** `2026.W34`
- **Dueño de cadencia:** CL (Cristian Lorca)
- **Rama:** `Dev`
- **Estado:** abierto tras Seminario 1

## Contexto

El plan maestro está en Google Sheets / `Personal/plan-semanal-openevm.csv`.  
Esta semana = **Fundaciones MVP** (no F30, no PWA, no motor EVM completo).

## Mejoras previstas (máx. 5)

| # | Alcance | Código | Tag -dev propuesto | Criterio de listo |
|---|---------|--------|--------------------|-------------------|
| 1 | env-local | CL | `v0.2.x-dev.2026.W34+CL.env` | API arranca con `.env` local |
| 2 | api-skeleton | CL | `…+CL.api-skeleton` | `/health` 200 + `/docs` |
| 3 | schema-v0 | CL | `…+CL.schema-v0` | tablas tenant/project/activity |
| 4 | ui-health | CL | `…+CL.ui-health` | Streamlit muestra health |
| 5 | smoke-local | CL | — | checklist manual en comentario |

## Compromisos

- [x] Trabajo solo en `Dev`
- [x] No reescribir tags antiguos
- [x] No PR a `main` sin pasar `staging` cuando haya paquete

## Checklist de cierre

- [ ] Tags -dev creados donde aplique
- [ ] Listo para staging (solo si hay algo validable)
- [ ] Tabla Sheets marcada en W34
