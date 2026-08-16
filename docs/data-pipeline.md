# Data Pipeline — Línea base y Presupuesto Meta (Lean / Fase 2)

> **Contexto:** Seminario de Grado II · UNAB-EVM  
> **Stack:** FastAPI (Python) · Supabase (PostgreSQL + Storage) · Streamlit (tablero Owner/PMO)  
> **Enfoque:** MVP lean con rigor operativo de obra chilena (APUs, recubicaciones, Oficina Técnica).

---

## 1. Propósito

El pipeline **no congela a ciegas** el presupuesto contractual de licitación importado.
Ese archivo es solo el punto de partida administrativo. El control EVM / Curva S se ancla
al **Presupuesto Meta** (también llamado **presupuesto de control interno**), construido
durante el primer mes de faena a partir de **APUs reales de terreno**.

```text
Licitación (contractual)  →  DRAFT (recubicar + cotizar APU)  →  baseline.freeze  →  v1.0 Presupuesto Meta
                                                                                      ↓
                                                                            replan → v2.0, v3.0… (histórico vivo)
```

---

## 2. Ciclo de vida del presupuesto

| Estado / versión | Quién actúa | Qué ocurre |
|------------------|-------------|------------|
| Importación inicial | PMO / Oficina Técnica | CSV/Excel contractual entra como **`DRAFT`**. No genera $PV$ oficial ni Curva S de control. |
| Recubicación + cotización (≈ 1er mes de faena) | Administrador de Obra (decisión) + Oficina Técnica (digitación/análisis) | Ajuste de cantidades, precios unitarios y rendimientos con **APU real de terreno** (proveedores, leyes sociales, equipos, subcontratos). |
| `baseline.freeze` → **v1.0** | PMO/Operaciones (autoriza) | Nace el **Presupuesto Meta / Control Interno**. Inmutable. Punto cero EVM ($BAC$, $PV$ planificado). |
| `baseline.replan` → **v2.0+** | PMO + Owner según umbral | Nueva versión de control; **v1.0…vN conviven** en histórico para auditoría y análisis de desvíos. |

### Regla Lean (MVP)

- Sin `baseline.freeze`, el tablero Streamlit muestra el proyecto en **modo preparación** (sin semáforos de desvío contractual vs. meta).
- El congelamiento es una **acción explícita** de API (`POST /baselines/{id}/freeze`), no un efecto lateral de la importación.

---

## 3. El Presupuesto Meta (APU real)

### 3.1 Qué NO es

- No es el PDF/Excel de licitación “tal cual”.
- No es el precio de venta al mandante sin desglose operativo.

### 3.2 Qué SÍ es

La estructura de costos con la que la PYME **decide y controla** la obra:

- Partidas / ítems alineados a EDT (WBS) operable en terreno.
- **APU** (Análisis de Precios Unitarios) recalculados con:
  - mano de obra + **leyes sociales**,
  - materiales cotizados post-adjudicación,
  - equipos / arriendos reales,
  - subcontratos negociados,
  - gastos generales e imprevistos de control interno.
- Cantidades **recubicadas** tras replanteo / primer mes de faena (Oficina Técnica + ITO / terreno).

### 3.3 Roles en la recubicación (responsabilidad, no digitación masiva del CEO)

| Rol | Responsabilidad en DRAFT |
|-----|--------------------------|
| **Owner / CEO** | Visibilidad de impacto en margen; aprueba umbrales de freeze si la política del tenant lo exige. **No digita APUs.** |
| **PMO / Operaciones** | Orquesta el ciclo DRAFT → freeze; ejecuta `baseline.freeze`. |
| **Oficina Técnica / Finanzas (apoyo)** | Carga y edita partidas/APU en DRAFT; documenta supuestos de cotización. |
| **Administrador de Obra** | Valida coherencia estratégica (¿este meta sostiene el contrato?); **Dashboard-First**. |
| **Terreno** | Aporta datos de rendimientos y avances; no edita el Presupuesto Meta. |

---

## 4. Plantilla de importación (CSV / Excel)

Columnas mínimas del MVP (licitación → DRAFT):

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `activity_code` | string | Código EDT / WBS / partida |
| `activity_name` | string | Nombre de la actividad / partida |
| `start_date` | date | Inicio planificado |
| `finish_date` | date | Término planificado |
| `budget_pv` | decimal | Monto planificado inicial (contractual o borrador) |
| `unit` | string (opc.) | Unidad (m², m³, gl, etc.) |
| `qty` | decimal (opc.) | Cantidad (base para recubicar) |
| `unit_price` | decimal (opc.) | Precio unitario (base APU) |
| `weight` | decimal (opc.) | Ponderación para avance físico |
| `area_code` | string (opc.) | Área responsable |
| `cost_type` | string (opc.) | `directo` \| `subcontrato` \| `gg` \| otro |

Tras importar, el registro de baseline queda:

```json
{
  "status": "DRAFT",
  "source": "bid_import",
  "version": null,
  "label": null
}
```

Tras freeze:

```json
{
  "status": "FROZEN",
  "version": "v1.0",
  "label": "Presupuesto Meta / Control Interno",
  "frozen_at": "ISO-8601",
  "frozen_by": "user_id"
}
```

---

## 5. Validaciones del pipeline (FastAPI)

1. **Schema y tipos** (Pydantic).
2. `start_date` ≤ `finish_date`.
3. Consistencia de $\sum budget\_pv$ vs. presupuesto de proyecto (tolerancia configurable por tenant).
4. Persistencia obligatoria en **`DRAFT`** hasta `baseline.freeze`.
5. Edición de APU / cantidades **solo** si `status = DRAFT` (o en una *working copy* previa a un nuevo `replan`).
6. `baseline.freeze` exige:
   - al menos una partida con presupuesto > 0,
   - permiso RBAC `baseline.freeze`,
   - (opcional tenant) checklist de recubicación marcada por Oficina Técnica.

---

## 6. Versionado e histórico

```text
v1.0  Presupuesto Meta          ← control EVM activo
v2.0  Reprogramación (alcance / precio / plazo)
v3.0  …
```

- Cada versión **congelada** es inmutable en PostgreSQL.
- El motor EVM usa la versión **activa** (`is_active = true`).
- Streamlit permite comparar Curva S / $PV$ entre versiones (histórico) sin reescribir el pasado.

---

## 7. Flujo técnico (MVP)

```text
[CSV/Excel]
    → FastAPI /baselines/import
    → PostgreSQL (baseline_headers + baseline_lines, status=DRAFT)
    → Edición APU/recubicar (Oficina Técnica)
    → FastAPI /baselines/{id}/freeze
    → version=v1.0, label=Presupuesto Meta
    → Cálculo PV diario / Curva S (job o on-read)
    → Streamlit Dashboard (Owner / Administrador de Obra)
```

Replan:

```text
DRAFT de trabajo (copia) → edición → baseline.replan → vN.0 activa + histórico
```

---

## 8. Fuera de alcance del MVP (explícito)

- Integración nativa con softwares de cubicación 3D.
- Motor APU completo tipo ERP de costos (se prioriza estructura tabular + evidencia de supuestos).
- Conciliación automática con factura electrónica del SII (candidato Fase posterior).
