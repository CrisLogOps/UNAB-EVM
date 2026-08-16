# Reglas de negocio — Control de obra Lean / Fase 2

> **Contexto:** Seminario de Grado II · UNAB-EVM  
> **Dominio:** PYMEs constructoras / proyectos con gasto variable en terreno (Chile)  
> **Stack de aplicación:** FastAPI (motor de reglas) · PostgreSQL/Supabase · Streamlit (KPI)  
> **Principio:** pocas reglas duras, auditables y bloqueantes donde el riesgo legal/financiero es alto.

---

## 0. Glosario operativo (Chile)

| Término | Uso en UNAB-EVM |
|---------|-----------------|
| **APU** | Análisis de Precios Unitarios — base del Presupuesto Meta |
| **Estado de Pago (EP)** | Certificación periódica de avance/cobro a mandante o a subcontrato |
| **ITO** | Inspección Técnica de Obra (validación externa / mandante; el sistema registra evidencia) |
| **Recubicación** | Ajuste de cantidades post-adjudicación / primer mes de faena |
| **Leyes sociales** | Cargas laborales/previsionales embebidas en costo de MO y en riesgo de subcontratos |
| **F30 / F30-1** | Certificados de cumplimiento laboral-previsional y detalle de multas (DT) |
| **Administrador de Obra** | Decisor estratégico / Dashboard-First — no digitador de terreno |

---

## 1. Candado metodológico — bloqueo de $EV$

El Valor Ganado ($EV$) **no se contabiliza** si el avance reportado carece de evidencia
documental en estado `validada`.

```text
EV := f(% avance físico, presupuesto de actividad en versión activa)
     iff evidencia.estado = "validada"
     else EV permanece sin incremento (bloqueo)
```

### Implicaciones MVP

- Terreno puede **enviar** avance + foto/GPS (`progress.submit`, `evidence.upload`).
- Solo un rol con `evidence.approve` (típicamente PMO / Oficina Técnica / calidad) **desbloquea** $EV$.
- El Dashboard Owner muestra “avance declarado” vs. “avance ganado” por separado.

---

## 2. Presupuesto Meta — freeze y replan

Complementa [`data-pipeline.md`](./data-pipeline.md).

1. Importación CSV/Excel (licitación) → estado **`DRAFT`** (no es baseline de control).
2. Recubicación + cotización real de **APUs de terreno** (primer mes de faena).
3. `baseline.freeze` → **v1.0 — Presupuesto Meta / Control Interno** (inmutable).
4. Desvíos relevantes → `baseline.replan` → **v2.0+**, conviviendo con el histórico.

**Regla:** el motor EVM ($PV$, $BAC$, Curva S de control) usa exclusivamente la versión
**activa congelada**, nunca el DRAFT de licitación.

---

## 3. Candado de control laboral (F30 y F30-1) — regla crítica

### 3.1 Motivación

En Chile, la empresa principal puede enfrentar **responsabilidad laboral solidaria**
respecto de subcontratistas. Blindar la PYME exige que **no se procese financieramente**
un Estado de Pago de subcontrato sin respaldo previsional del período.

### 3.2 Regla: *El Candado Laboral*

Para cada **empresa subcontratista** y cada **período de control** asociado a un EP:

1. El sistema exige la carga de:
   - **F30** — Certificado de Cumplimiento de Obligaciones Laborales y Previsionales.
   - **F30-1** — Detalle de Multas (cuando aplique / período).
2. Ambos documentos deben quedar en estado **`validado`** (permiso `labor.f30.approve`).
3. Si faltan, están vencidos respecto del período, o no validados:

| Efecto | Comportamiento |
|--------|----------------|
| Alerta | Severidad **ROJA** inmediata en tablero (Owner / Finanzas / PMO) |
| Bloqueo backend | FastAPI **rechaza** el procesamiento financiero del EP del subcontrato (`402`/`409` de dominio + código `LABOR_LOCK`) |
| Trazabilidad | Evento en auditoría: `labor.lock.engaged` con `subcontractor_id`, `period`, `missing_docs[]` |

```text
IF subcontractor.ep.period REQUIRES labor_certs
AND NOT (F30.validado AND F30-1.conforme_para_periodo)
THEN
    alert.severity = ROJA
    BLOCK finance.process_payment_certificate(ep_id)
ELSE
    ALLOW finance pipeline (sujeto a retenciones y otras reglas)
```

### 3.3 Alcance Lean

- MVP: aplica a **subcontratos** tipificados `cost_type = subcontrato` / proveedor marcado `is_subcontractor = true`.
- Personal propio de la empresa principal: fuera del candado F30 de terceros (otra cola de compliance, no bloquea el mismo endpoint en Fase 2).
- La validación es **humana** (Finanzas / PMO); el sistema no “lee” el PDF con OCR obligatorio en el MVP (opcional posterior).

---

## 4. Retenciones de fiel cumplimiento (5% – 10%)

### 4.1 Regla matemática

Sobre cada **Estado de Pago (EP) de subcontrato aprobado** (y no bloqueado por Candado Laboral):

```text
retencion_pct ∈ [0.05, 0.10]     # parametrizable por contrato / tenant (default 0.05)
monto_ep_bruto                  # avance valorizado del período
retencion_monto = redondeo(monto_ep_bruto × retencion_pct)
monto_neto_a_pago = monto_ep_bruto − retencion_monto − otras_glosas
```

- El porcentaje se define a nivel de **contrato de subcontrato** (o default del tenant).
- El cálculo es **automático** en FastAPI al aprobar el EP (`finance.ep.approve`).
- No es editable “a mano” en el pago sin permiso `finance.retention.override` (Owner / Finanzas senior).

### 4.2 Ciclo de vida de la retención

```text
EP aprobado
  → retención CREATED (estado: RETENIDA)
  → acumula en cuenta de garantía del subcontrato
  → puede usarse conceptualmente para:
        • contingencias laborales de terceros
        • fallas de calidad / garantía civil de largo plazo
  → RELEASE solo con autorización explícita (finance.retention.release)
  → estado FINAL: LIBERADA | APLICADA_A_CONTINGENCIA
```

| Estado | Significado |
|--------|-------------|
| `RETENIDA` | Garantía viva; no forma parte del neto pagado al subcontrato |
| `LIBERADA` | Devolución autorizada según contrato (fin de obra / hito / fin de garantía) |
| `APLICADA_A_CONTINGENCIA` | Uso parcial/total contra multa, falla o pasivo laboral acreditado |

### 4.3 Quién autoriza la devolución

- **Finanzas** propone / ejecuta con `finance.retention.release`.
- **Owner / CEO** o **PMO** pueden requerirse por política de doble control (configurable).
- El **Administrador de Obra** ve el saldo retenido en el dashboard; **no** libera retenciones desde terreno.

---

## 5. Costos reales ($AC$) y subcontratos

- $AC$ se alimenta de: gastos directos, EP de subcontratos **netos + retenciones** (visión gerencial del costo comprometido), y ajustes.
- Para EVM de control interno, el MVP registra:
  - `ac_paid` (egreso neto),
  - `ac_retained` (retenciones vigentes),
  - `ac_committed ≈ ac_paid + ac_retained` (exposición).

---

## 6. Severidad de alertas (tablero)

| Código | Severidad | Ejemplos |
|--------|-----------|----------|
| `LABOR_LOCK` | **ROJA** | F30/F30-1 faltante o no validado |
| `EV_BLOCKED` | Ámbar | Avance sin evidencia validada |
| `SPI_LOW` / `CPI_LOW` | Ámbar → Roja según umbral tenant | Desvío de plazo/costo vs. Presupuesto Meta |
| `RETENTION_DUE` | Info / Ámbar | Saldo retenido listo para revisión contractual |

---

## 7. Orden de evaluación en backend (FastAPI)

Para `POST /finance/payment-certificates/{id}/process`:

1. AuthN + AuthZ (RBAC).
2. **Candado Laboral** (si subcontrato) → bloqueo duro.
3. Existencia de versión de baseline activa (Presupuesto Meta).
4. Cálculo de retención 5–10%.
5. Persistencia de movimientos + eventos de auditoría.
6. Emisión de alertas / invalidación de caché de KPI (Streamlit lee desde API/DB).

---

## 8. Fuera de alcance explícito (Fase 2 Lean)

- Dictamen legal automático sustituyendo a asesoría laboral.
- Integración directa con web de la Dirección del Trabajo (manual upload + validación humana).
- Motor de garantías bancarias / boletas de garantía (solo retenciones de EP en MVP).
