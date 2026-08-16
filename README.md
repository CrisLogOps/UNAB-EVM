# OpenEVM / UNAB-EVM — Control de obras y proyectos con EVM para PYMEs

[![Español](https://img.shields.io/badge/Idioma-Español-0f7a5f?style=flat-square)](./README.md)
[![English](https://img.shields.io/badge/Language-English-1e3a5f?style=flat-square)](./README.en.md)
[![Stack](https://img.shields.io/badge/Stack-Supabase%20%7C%20FastAPI%20%7C%20Streamlit-0ea5e9?style=flat-square)](#stack-tecnológico)
[![Fase](https://img.shields.io/badge/Fase-2%20Seminario%20II-blue?style=flat-square)](./docs)

> **Documentación en inglés:** [README.en.md](./README.en.md)

Plataforma **SaaS Lean/MVP** para el control de proyectos con gasto variable en terreno — especialmente **obras y faenas en Chile** — con motor **EVM**, **Curva S**, **RBAC multi-tenant**, **Presupuesto Meta (APU real)** y candados operativos (evidencia, laboral F30/F30-1 y retenciones).

| | |
|---|---|
| **Producto (código)** | Este repositorio |
| **Sitio de propuesta** | [CrisLogOps/OpenEVM](https://github.com/CrisLogOps/OpenEVM) (Netlify) |
| **Desarrollo** | `Dev` |
| **Validación pre-producción** | `staging` |
| **Producción** | `main` |

### Flujo de ramas

```text
Dev  ──(PR / merge)──►  staging  ──(validación OK)──►  main
 ▲                         │                            │
 │                         │  pruebas, revisión, QA     │  producción
 └──── desarrollo diario ──┘                            └── estable
```

| Rama | Uso |
|------|-----|
| **`Dev`** | Trabajo diario de desarrollo (features, docs, fixes). |
| **`staging`** | Punto de **validación** antes de producción: integrar lo estable de `Dev`, probar y revisar. |
| **`main`** | Producción / referencia pública estable del producto. |

Regla Lean: nada llega a `main` sin haber pasado por `staging` (salvo hotfixes críticos acordados).

---

## ¿Para quién?

Dirigido a **público hispanohablante** y, en particular, a **PYMEs constructoras y de terreno en Chile** que hoy controlan con Excel, chats y “avance a ojo”, y necesitan:

- Validar **avance físico** y **presupuesto** con corte frecuente (incluso diario).
- Blindar la empresa ante **responsabilidad laboral solidaria** de subcontratos (F30 / F30-1).
- Separar el **precio de licitación** del **Presupuesto Meta** de control interno (recubicaciones y APU reales).
- Que el **Administrador de Obra / Owner** mire **KPI en dashboard**, no digite en faena.

---

## Diferenciadores (Fase 2)

1. **Presupuesto Meta (APU real)** — la importación contractual entra en `DRAFT`; tras recubicar/cotizar en el primer mes de faena se ejecuta `baseline.freeze` → **v1.0**. Las reprogramaciones generan **v2.0+** con histórico.
2. **Candado de evidencia ($EV$)** — sin evidencia validada, el Valor Ganado no suma.
3. **Candado laboral (F30 / F30-1)** — sin certificados validados del período: alerta **ROJA** y bloqueo del procesamiento financiero del Estado de Pago del subcontrato.
4. **Retenciones de fiel cumplimiento (5%–10%)** — cálculo automático por EP aprobado; liberación solo con autorización explícita.
5. **Terreno offline-first (PWA + GPS)** — captura de avance sin señal; sync a Supabase al recuperar red.
6. **RBAC Dashboard-First** — Owner / Administrador de Obra deciden; Terreno y Oficina Técnica operan el dato.

Detalle normativo y técnico:

| Documento | Contenido |
|-----------|-----------|
| [docs/data-pipeline.md](./docs/data-pipeline.md) | Presupuesto Meta, DRAFT → freeze |
| [docs/business-rules.md](./docs/business-rules.md) | Candados EV / laboral, retenciones |
| [docs/architecture.md](./docs/architecture.md) | ADRs, PWA offline + GPS |
| [docs/rbac-matrix.md](./docs/rbac-matrix.md) | Matriz de permisos Fase 2 |
| [docs/versioning.md](./docs/versioning.md) | Tags semanales y nomenclatura por integrante |
| [docs/integration/](./docs/integration/) | Factibilidad por olas |

---

## Stack tecnológico

| Capa | Tecnología | Rol |
|------|------------|-----|
| Datos / Auth / Storage | **Supabase (PostgreSQL)** | Multi-tenant, evidencias, F30 |
| API / reglas de negocio | **FastAPI (Python)** | EVM, RBAC, candados, EP |
| Tablero gerencial | **Streamlit** | Owner, Admin de Obra, PMO, Finanzas |
| Captura en faena | **PWA offline-first** | Jefe de Terreno + GPS |
| Propuesta pública | Netlify (`OpenEVM`) | Landing ES/EN |

---

## Flujo resumido

```text
Licitación (CSV) → DRAFT (recubicar + APU real) → freeze v1.0 Presupuesto Meta
        ↓
Terreno (PWA): avance + foto + GPS  →  evidencia validada  →  EV
        ↓
Finanzas: F30/F30-1 + EP subcontrato → retención 5–10% → pago neto (si no hay candado laboral)
        ↓
Streamlit: Curva S, CPI/SPI, alertas ROJAS
```

---

## Quickstart local

```bash
git clone git@github.com:CrisLogOps/UNAB-EVM.git
cd UNAB-EVM
git checkout Dev

cp .env.example .env   # completar SUPABASE_* y secretos

# API
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Dashboard
cd ../frontend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && streamlit run app.py
```

> Si algún módulo aún es scaffold, seguir el estado en [`docs/roadmap.md`](./docs/roadmap.md).

---

## Estructura del repositorio

```text
UNAB-EVM/
├── README.md              ← este archivo (español, principal)
├── README.en.md           ← English documentation
├── backend/               # FastAPI
├── frontend/              # Streamlit
├── database/              # esquemas / migraciones
├── docs/                  # reglas, arquitectura, RBAC, pipeline
├── tests/
└── scripts/
```

---

## Equipo y gobernanza

Proyecto de **Seminario de Grado** (UNAB).  
Código de producto en este repo; sitio de difusión en [OpenEVM](https://github.com/CrisLogOps/OpenEVM).

**Licencia:** uso académico / ver `LICENSE`.

---

## English documentation

For the English version of this README, open **[README.en.md](./README.en.md)**.
