# Arquitectura — ADRs y diseño Fase 2 (Lean / MVP)

> **Contexto:** Seminario de Grado II · UNAB-EVM  
> **Stack oficial:** Supabase (PostgreSQL + Storage + Auth) · FastAPI (Python) · Streamlit (Owner / PMO) · PWA de terreno (offline-first)  
> Documento vivo: decisiones aceptadas, trade-offs y límites del MVP.

> Factibilidad de integración por componente: ver [`integration/`](./integration/README.md).

---

## Vista lógica (MVP)

```text
┌─────────────────────┐     ┌──────────────────────┐
│ Streamlit           │     │ PWA Terreno          │
│ Dashboard-First     │     │ Offline-first + GPS  │
│ Owner / Admin Obra  │     │ Jefe de Terreno      │
│ PMO / Finanzas      │     └──────────┬───────────┘
└──────────┬──────────┘                │ sync cola
           │ HTTPS                     │ (al recuperar red)
           ▼                           ▼
     ┌─────────────────────────────────────────┐
     │              FastAPI (reglas + RBAC)     │
     │  baseline · evidence · labor · finance  │
     └───────────────────┬─────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           ▼                           ▼
   PostgreSQL (Supabase)      Supabase Storage
   tenants, baselines,        evidencias / F30
   EP, retenciones, audit     fotos de avance
```

Separación de UX (Lean):

| Superficie | Usuario objetivo | Job to be done |
|------------|------------------|----------------|
| **Streamlit** | Owner/CEO, Administrador de Obra, PMO, Finanzas | Ver KPI, alertas ROJAS, aprobar/autorizar |
| **PWA terreno** | Jefe de Terreno / cuadrilla | Capturar avance + evidencia con poca fricción, con o sin señal |

El Administrador de Obra **no** es el digitador de faena: consume tablero y decide; el dato nace en terreno y Oficina Técnica.

---

## ADR-001 — Stack Fase 1 / continuidad Fase 2

- **Estado:** Aceptado
- **Decisión:** Supabase (PostgreSQL) + FastAPI + Streamlit + deploy freemium (Render / Streamlit Cloud / Netlify solo para sitio de propuesta)
- **Alternativas:** Flask, Dash, hosting propio
- **Consecuencia:** Un solo backend de reglas; dos frontends especializados (gestión vs. captura)
- **Fase 2:** Se mantiene el stack; se añade PWA de terreno como cliente adicional del mismo FastAPI

## ADR-002 — Multi-tenancy lógico

- **Estado:** Aceptado
- **Decisión:** Aislamiento por `tenant_id` en PostgreSQL; RLS en Supabase endurecible por ola
- **Consecuencia:** Owner/CEO parametriza áreas y RBAC por organización
- **Fase 2:** Toda fila de baseline, EP, F30 y retención lleva `tenant_id` + `project_id`

## ADR-003 — Sitio de propuesta fuera del repo de producto

- **Estado:** Aceptado (actualizado)
- **Decisión:** Landing de propuesta en repositorio/web aparte (`OpenEVM` / Netlify); producto en `UNAB-EVM`
- **Consecuencia:** El repo técnico no mezcla marketing; el CTA de colaboración apunta al código

## ADR-004 — Presupuesto Meta como baseline de control

- **Estado:** Aceptado (Fase 2)
- **Decisión:** La importación contractual entra en `DRAFT`; el control EVM solo usa versiones congeladas (`v1.0` Presupuesto Meta, luego `v2.0+`)
- **Consecuencia:** Ver [`data-pipeline.md`](./data-pipeline.md)
- **Alternativa rechazada:** Congelar automáticamente el Excel de licitación al subir

## ADR-005 — Candados de dominio en backend

- **Estado:** Aceptado (Fase 2)
- **Decisión:** FastAPI aplica *Candado EV*, *Candado Laboral (F30/F30-1)* y *retenciones 5–10%* como reglas de servidor (no solo UI)
- **Consecuencia:** Ver [`business-rules.md`](./business-rules.md)
- **Alternativa rechazada:** Validar solo en Streamlit (bypassable)

## ADR-006 — Captura offline-first con GPS en terreno

- **Estado:** Aceptado (Fase 2 — diseño objetivo MVP+)
- **Decisión:** Interfaz de terreno como **PWA responsiva** con enfoque **offline-first**
- **Detalle:** sección siguiente
- **Alternativas:** App nativa iOS/Android (costo alto para PYME); solo formularios online Streamlit (falla en subterráneos / faenas aisladas)

---

## Captura offline-first con GPS en terreno

### Problema operativo

En subterráneos, túneles, zonas rurales o faenas con cobertura intermitente, el Jefe de Terreno **no puede depender** de una sesión online para registrar el hito de avance. Si el sistema exige conectividad, el dato se pierde o se inventa “después en oficina”, rompiendo la trazabilidad EVM.

### Decisión de diseño

1. **PWA instalable** (service worker + `manifest.webmanifest`) usable en smartphone/tablet.
2. **Offline-first:** escritura local inmediata (IndexedDB / cola persistente).
3. Cada registro de avance captura, cuando el dispositivo lo permita:
   - foto(s) del frente / hito,
   - **coordenadas GPS** (`latitude`, `longitude`, `accuracy`),
   - **timestamp del dispositivo** (`captured_at_device`),
   - `activity_code`, `%` o cantidad, notas,
   - `project_id` / `tenant_id` cacheados tras login.
4. Al recuperar **Wi‑Fi o datos móviles**, un **sync worker** vacía la cola hacia:
   - **Supabase Storage** (binarios de evidencia),
   - **FastAPI → PostgreSQL** (metadatos de avance + enlace a storage + GPS).
5. El desbloqueo de $EV$ sigue requiriendo `evidence.approve` en backend (Candado EV); la PWA solo **captura**, no aprueba.

### Flujo de sincronización

```text
[Sin red]
  Jefe de Terreno → foto + hito + GPS + time
                 → IndexedDB queue (status=PENDING_SYNC)

[Con red]
  sync worker → POST /evidence/upload (Storage URL)
             → POST /progress/submit (payload + geo + device_ts)
             → marca local SYNCED | CONFLICT

[Conflicto]
  política Lean: last-write-wins en metadatos menores;
  evidencias nunca se borran (append-only) → revisión humana en PMO
```

### Contratos mínimos (FastAPI)

| Endpoint (conceptual) | Rol típico | Notas |
|-----------------------|------------|-------|
| `POST /progress/submit` | Terreno | Idempotente por `client_event_id` |
| `POST /evidence/upload` | Terreno | Devuelve path Storage |
| `POST /evidence/{id}/approve` | PMO / OT | Desbloquea $EV$ |
| `GET /sync/cursor` | Terreno | Catálogo liviano de actividades del proyecto |

### Seguridad y privacidad (MVP)

- Tokens cortos / refresh vía Supabase Auth; cola local sin secretos de servicio.
- GPS es **evidencia de contexto**, no geocerca legal por sí sola.
- Retención de fotos según política del tenant (Storage lifecycle diferible).

### Relación con Streamlit

Streamlit **no** reemplaza la PWA: consume avances ya sincronizados, muestra mapa/listado de evidencias pendientes y KPIs. Owner/Administrador de Obra trabajan **Dashboard-First**.

### Alcance Lean

| Incluido en diseño Fase 2 | Diferido |
|---------------------------|----------|
| PWA + cola offline + GPS + sync a Supabase | Edición offline de Presupuesto Meta |
| Idempotencia por `client_event_id` | Modo colaborativo multi-dispositivo en el mismo hito |
| UI responsiva móvil | App store nativa |

---

## Despliegue de referencia

| Componente | Hosting típico MVP |
|------------|--------------------|
| FastAPI | Render / Fly / contenedor |
| Streamlit | Streamlit Community Cloud / Render |
| Supabase | Proyecto cloud (DB + Storage + Auth) |
| PWA terreno | Mismo origen estático o CDN (Netlify/Cloudflare) apuntando a API |
| Sitio propuesta | Repo `OpenEVM` en Netlify (fuera de este código) |

---

## Diagramas y deuda

- OpenAPI formal: `docs/api-openapi.yaml` (pendiente de generación desde FastAPI).
- RLS estricto por tenant: endurecer en ola de seguridad tras MVP funcional.
