# OpenEVM / UNAB-EVM — EVM project & worksite control for SMEs

[![Español](https://img.shields.io/badge/Idioma-Español-0f7a5f?style=flat-square)](./README.md)
[![English](https://img.shields.io/badge/Language-English-1e3a5f?style=flat-square)](./README.en.md)
[![Stack](https://img.shields.io/badge/Stack-Supabase%20%7C%20FastAPI%20%7C%20Streamlit-0ea5e9?style=flat-square)](#technology-stack)
[![Phase](https://img.shields.io/badge/Phase-2%20Degree%20Seminar%20II-blue?style=flat-square)](./docs)
[![License](https://img.shields.io/badge/License-Academic-lightgrey?style=flat-square)](./LICENSE)

> **Primary documentation is in Spanish:** [README.md](./README.md)  
> This file is the English mirror for international readers and bilingual reviewers.

Lean/MVP **SaaS** for controlling projects with **variable field costs** — with a strong fit for **Chilean construction SMEs** — featuring an **EVM** engine, **S-curve**, **multi-tenant RBAC**, a **Control Budget / Meta Budget (real unit-price analysis)**, and operational locks (evidence, labor certificates F30/F30-1, and retainage).

| | |
|---|---|
| **Product (code)** | This repository |
| **Proposal site** | [CrisLogOps/OpenEVM](https://github.com/CrisLogOps/OpenEVM) (Netlify) |
| **Development** | `Dev` |
| **Pre-production validation** | `staging` |
| **Production** | `main` |

### Branch flow

```text
Dev  ──(PR / merge)──►  staging  ──(validation OK)──►  main
 ▲                         │                            │
 │                         │  tests, review, QA         │  production
 └──── day-to-day work ────┘                            └── stable
```

| Branch | Purpose |
|--------|---------|
| **`Dev`** | Day-to-day development (features, docs, fixes). |
| **`staging`** | **Validation gate** before production: integrate stable work from `Dev`, test and review. |
| **`main`** | Production / stable public product reference. |

Lean rule: nothing reaches `main` without going through `staging` (except agreed critical hotfixes).

### Contributing (community)

We welcome interested contributors **under code control**: open PRs against **`Dev`**; a maintainer reviews; only maintainers promote to `staging` / `main` (production).

- Full guide: **[CONTRIBUTING.en.md](./CONTRIBUTING.en.md)** · [Español](./CONTRIBUTING.md)
- PR template and `CODEOWNERS` under `.github/`

---

## Who is this for?

Spanish-speaking operators and **Chilean field/construction SMEs** that today run control on spreadsheets and chat, and need to:

- Validate **physical progress** and **budget** on a frequent (even daily) cutoff.
- Protect the firm from **joint labor liability** on subcontractors (F30 / F30-1 certificates).
- Separate the **bid/contract price** from the internal **Meta / Control Budget** (re-takeoffs and real APUs).
- Keep the **Works Administrator / Owner** on a **KPI dashboard**, not typing data on site.

---

## Phase 2 differentiators

1. **Meta Budget (real APU)** — contractual import lands as `DRAFT`; after re-takeoff/quoting in the first month on site, `baseline.freeze` creates **v1.0**. Later replans produce **v2.0+** with full history.
2. **Evidence lock ($EV$)** — without validated evidence, Earned Value does not increase.
3. **Labor lock (F30 / F30-1)** — missing/unvalidated period certificates → **RED** alert and backend block of the subcontractor payment certificate (Estado de Pago).
4. **Performance retainage (5%–10%)** — automatic hold on approved subcontractor payment certificates; release only with explicit authorization.
5. **Offline-first field capture (PWA + GPS)** — progress logged without signal; sync to Supabase when connectivity returns.
6. **Dashboard-First RBAC** — Owner / Works Administrator decide; Field and Technical Office own data entry.

Deep dives (Spanish technical docs; English summaries may follow):

| Document | Topic |
|----------|--------|
| [docs/data-pipeline.md](./docs/data-pipeline.md) | Meta Budget, DRAFT → freeze |
| [docs/business-rules.md](./docs/business-rules.md) | EV / labor locks, retainage |
| [docs/architecture.md](./docs/architecture.md) | ADRs, offline PWA + GPS |
| [docs/rbac-matrix.md](./docs/rbac-matrix.md) | Phase 2 permission matrix |
| [docs/versioning.md](./docs/versioning.md) | Weekly tags & member nomenclature ([EN summary](./docs/versioning.en.md)) |
| [docs/integration/](./docs/integration/) | Feasibility by delivery waves |

---

## Technology stack

| Layer | Technology | Role |
|-------|------------|------|
| Data / Auth / Storage | **Supabase (PostgreSQL)** | Multi-tenant, evidence, F30 files |
| API / business rules | **FastAPI (Python)** | EVM, RBAC, locks, payment certificates |
| Management dashboard | **Streamlit** | Owner, Works Admin, PMO, Finance |
| Field capture | **Offline-first PWA** | Site lead + GPS |
| Public proposal site | Netlify (`OpenEVM`) | ES/EN landing |

---

## Flow (short)

```text
Bid CSV → DRAFT (re-takeoff + real APU) → freeze v1.0 Meta Budget
        ↓
Field (PWA): progress + photo + GPS  →  validated evidence  →  EV
        ↓
Finance: F30/F30-1 + subcontractor PC → 5–10% retainage → net pay (unless labor-locked)
        ↓
Streamlit: S-curve, CPI/SPI, RED alerts
```

---

## Local quickstart

```bash
git clone git@github.com:CrisLogOps/UNAB-EVM.git
cd UNAB-EVM
git checkout Dev

cp .env.example .env   # set SUPABASE_* and secrets

# API
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload

# Dashboard
cd ../frontend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && streamlit run app.py
```

> If a module is still scaffold-only, check [`docs/roadmap.md`](./docs/roadmap.md).

---

## Repository layout

```text
UNAB-EVM/
├── README.md              ← Spanish (primary)
├── README.en.md           ← this file (English)
├── CONTRIBUTING.md        ← how to contribute (community → Dev → staging → main)
├── CONTRIBUTING.en.md
├── backend/               # FastAPI
├── frontend/              # Streamlit
├── database/              # schemas / migrations
├── docs/                  # rules, architecture, RBAC, pipeline
├── tests/
└── scripts/
```

---

## Team & governance

Degree seminar project (UNAB), open to **interested contributors** with mandatory review.  
Product code lives here; outreach site at [OpenEVM](https://github.com/CrisLogOps/OpenEVM).

**License:** **academic** (UNAB degree seminar) — see [`LICENSE`](./LICENSE).  
Educational / research / demo use. Commercial use or product redistribution: written permission from the authors.  
Team checklist: [`docs/license-academic.md`](./docs/license-academic.md).  
**Contributing:** [CONTRIBUTING.en.md](./CONTRIBUTING.en.md).

---

## Documentación en español

La documentación principal del repositorio está en **[README.md](./README.md)**.
