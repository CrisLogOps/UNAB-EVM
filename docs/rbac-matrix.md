# Matriz RBAC — Fase 2 (Lean / multi-tenant)

> **Contexto:** Seminario de Grado II · UNAB-EVM  
> **Principio:** el **Administrador de Obra** y el **Owner/CEO** son tomadores de decisión **Dashboard-First**.  
> La digitación operativa vive en **Terreno** (PWA) y **Oficina Técnica / Finanzas** (carga documental y APUs en DRAFT).

Stack de enforcement: **FastAPI** (dependencias de permiso) + claims/roles en **Supabase Auth** + `tenant_id` en **PostgreSQL**.

---

## 1. Roles del tenant (MVP)

| Rol | Código | Orientación |
|-----|--------|-------------|
| Owner / CEO | `owner` | Gobierno, margen, alertas ROJAS, RBAC |
| PMO / Operaciones | `pmo` | Orquesta baseline, aprueba evidencia, freeze/replan |
| Administrador de Obra | `admin_obra` | Decisión estratégica de faena; KPI; no digitador masivo |
| Finanzas | `finance` | $AC$, EP, F30, retenciones |
| Oficina Técnica | `oficina_tecnica` | Recubicar / editar DRAFT (APU), apoyo a evidencia |
| Terreno (Jefe de Terreno) | `field` | Avance + foto + GPS offline |
| Solo lectura | `viewer` | Consulta KPI sin mutaciones |

> **Nota:** “Administrador de Obra” ≠ administrador de sistema. El admin de plataforma del tenant suele ser `owner` con `rbac.admin`.

---

## 2. Permisos atómicos (catálogo Fase 2)

### Baseline / Presupuesto Meta

| Código | Descripción |
|--------|-------------|
| `baseline.upload` | Importar CSV/Excel de licitación → `DRAFT` |
| `baseline.draft.edit` | Editar partidas/APU/cantidades mientras `status=DRAFT` (recubicación) |
| `baseline.freeze` | Congelar **v1.0 Presupuesto Meta** |
| `baseline.replan` | Generar **v2.0+** (histórico + versión activa) |
| `baseline.read` | Leer versiones y comparar |

### Avance, evidencia y EVM

| Código | Descripción |
|--------|-------------|
| `progress.submit` | Enviar avance (PWA / API), incl. cola sync |
| `evidence.upload` | Subir foto/documento de respaldo |
| `evidence.approve` | Validar evidencia → desbloqueo de $EV$ |
| `evm.read` | KPIs, Curva S, semáforos |
| `alerts.read` | Lectura de alertas (incl. ROJAS) |

### Laboral (Candado F30 / F30-1)

| Código | Descripción |
|--------|-------------|
| `labor.f30.upload` | Cargar certificados F30 / F30-1 del período |
| `labor.f30.approve` | Validar F30 / F30-1 (libera candado si conforme) |
| `labor.lock.read` | Ver estado del Candado Laboral por subcontrato |

### Finanzas / Estados de Pago / retenciones

| Código | Descripción |
|--------|-------------|
| `cost.ac_upload` | Cargar costos reales ($AC$) |
| `finance.ep.prepare` | Armar EP de subcontrato / período |
| `finance.ep.approve` | Aprobar EP (dispara retención 5–10% si aplica) |
| `finance.ep.process` | Procesar pago neto (bloqueado si `LABOR_LOCK`) |
| `finance.retention.release` | Autorizar **devolución** de retención de fiel cumplimiento |
| `finance.retention.override` | Excepción controlada al % de retención (auditoría obligatoria) |
| `finance.retention.read` | Ver saldos retenidos |

### Gobierno

| Código | Descripción |
|--------|-------------|
| `rbac.admin` | Áreas, roles, asignación de usuarios del tenant |
| `project.admin` | Alta/cierre de proyectos del tenant |

---

## 3. Matriz rol × permiso

Leyenda: **C** = puede · **—** = no · **R** = solo lectura / ver

| Permiso | Owner | PMO | Admin Obra | Finanzas | Oficina Técnica | Terreno | Viewer |
|---------|:-----:|:---:|:----------:|:--------:|:---------------:|:-------:|:------:|
| `baseline.upload` | C | C | — | — | C | — | — |
| `baseline.draft.edit` | — | C | R* | — | C | — | — |
| `baseline.freeze` | C† | C | — | — | — | — | — |
| `baseline.replan` | C† | C | — | — | — | — | — |
| `baseline.read` | C | C | C | C | C | R | R |
| `progress.submit` | — | — | — | — | — | C | — |
| `evidence.upload` | — | C | — | — | C | C | — |
| `evidence.approve` | — | C | — | — | C | — | — |
| `evm.read` | C | C | C | C | C | R | R |
| `alerts.read` | C | C | C | C | C | R | R |
| `labor.f30.upload` | — | C | — | C | — | — | — |
| `labor.f30.approve` | — | C | — | C | — | — | — |
| `labor.lock.read` | C | C | C | C | R | — | R |
| `cost.ac_upload` | — | C | — | C | — | — | — |
| `finance.ep.prepare` | — | C | — | C | — | — | — |
| `finance.ep.approve` | C† | C | — | C | — | — | — |
| `finance.ep.process` | — | — | — | C | — | — | — |
| `finance.retention.release` | C† | C† | — | C | — | — | — |
| `finance.retention.override` | C | — | — | C† | — | — | — |
| `finance.retention.read` | C | C | C | C | R | — | R |
| `rbac.admin` | C | — | — | — | — | — | — |
| `project.admin` | C | C | — | — | — | — | — |

\* **R\*** Admin Obra: puede **comentar / solicitar cambio** sobre DRAFT; la edición masiva de APU es Oficina Técnica / PMO (evita convertir al Administrador en digitador).  
† Dual-control opcional por política del tenant (Owner confirma umbrales altos).

---

## 4. Mapeo a endpoints / acciones (FastAPI)

| Acción de negocio | Permiso requerido | Notas |
|-------------------|-------------------|-------|
| Importar licitación | `baseline.upload` | Resultado siempre `DRAFT` |
| Editar Presupuesto Meta en DRAFT | `baseline.draft.edit` | Recubicar / cotizar APU real |
| Freeze v1.0 | `baseline.freeze` | Crea Presupuesto Meta |
| Replan vN | `baseline.replan` | Histórico intacto |
| Sync avance PWA | `progress.submit` + `evidence.upload` | Offline queue → API |
| Aprobar evidencia | `evidence.approve` | Candado EV |
| Cargar F30 / F30-1 | `labor.f30.upload` | Período del EP |
| **Aprobar F30 / F30-1** | `labor.f30.approve` | Quita `LABOR_LOCK` si conforme |
| Procesar EP subcontrato | `finance.ep.process` | Falla si candado laboral activo |
| **Autorizar devolución de retenciones** | `finance.retention.release` | Ciclo RETENIDA → LIBERADA |
| Ver dashboard KPI | `evm.read` | Streamlit Owner / Admin Obra |

El backend **debe** revalidar permisos en cada mutación; la UI solo oculta controles.

---

## 5. Políticas de producto (Dashboard-First)

1. **Owner / CEO:** parametriza tenant, mira ROJAS (laboral, CPI/SPI), no carga fotos de faena.
2. **Administrador de Obra:** decide con Curva S / semáforos; escala a PMO/Finanzas; no opera la cola offline.
3. **Terreno:** única fuente feliz de avance físico georreferenciado.
4. **Finanzas + PMO:** dueños del Candado Laboral y de retenciones de fiel cumplimiento.
5. **Oficina Técnica:** dueña del DRAFT de APUs hasta el freeze.

---

## 6. Implementación Lean sugerida

```text
# Pseudocódigo FastAPI
dependable = require_permission("labor.f30.approve")

@router.post("/labor/certificates/{id}/approve")
def approve_f30(..., user=Depends(dependable)):
    ...
```

Tabla `role_permissions(tenant_id, role_code, permission_code)` permite que el Owner ajuste la matriz sin redesplegar, dentro de un set allowlist de códigos versionados.

---

## 7. Relación con otros docs

- Reglas de bloqueo: [`business-rules.md`](./business-rules.md)
- Ciclo DRAFT → Meta: [`data-pipeline.md`](./data-pipeline.md)
- PWA offline + GPS: [`architecture.md`](./architecture.md)
