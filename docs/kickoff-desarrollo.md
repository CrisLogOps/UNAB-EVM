# Kickoff de desarrollo — pie inicial (sin intervención mayor)

> **Importante — fechas:** el **martes próximo** corresponde a la **entrega / presentación de Fase 1 (Seminario de Grado 1)**.  
> Ese hito **no** es el arranque del MVP de código.  
> Este documento solo **organiza el repositorio** para comenzar el desarrollo **la semana siguiente** (plan `2026.W34`).

| Cuándo | Qué hacer |
|--------|-----------|
| **Ahora → martes** | Ensayo y entrega Seminario 1. No abrir frentes grandes de código. |
| **Después del martes (W34)** | Seguir el plan semanal: fundaciones MVP (API health, schema, Streamlit vivo). |

Plan detallado (personal / Sheets): carpeta local `Personal/plan-semanal-openevm.csv`.

---

## 1. Estructura ya definida en GitHub (usar tal cual)

```text
Dev       → trabajo diario / PRs de comunidad
staging   → validación pre-producción
main      → producción / referencia estable
```

| Pieza | Estado esperado |
|-------|-----------------|
| Ramas `Dev` / `staging` / `main` | Existen |
| Tags semanales (`docs/versioning.md`) | En uso |
| Issue “Seguimiento semanal” | Plantilla en `.github/ISSUE_TEMPLATE/` |
| `CONTRIBUTING.md` + LICENSE académica | En `Dev` |
| Protección de `main` | Activar si aún no (Require PR) — 2 minutos en Settings |

**No hace falta** crear más ramas ni reescribir historial para empezar.

---

## 2. Cómo trabajar (regla mínima)

1. Todo código nuevo → rama de trabajo desde **`Dev`** (o commit directo en `Dev` si eres el único mantenedor).  
2. Al cerrar una mejora relevante → tag `-dev` según `docs/versioning.md`.  
3. Promoción a `staging` / `main` → solo cuando el Issue semanal lo marque y haya algo que validar.  
4. Externos → PR solo a `Dev` (`CONTRIBUTING.md`).

---

## 3. Issues de arranque (crear en GitHub esta semana o justo después del martes)

Copia el contenido de:

| Archivo plantilla | Issue a crear |
|-------------------|---------------|
| [`templates/issues-arranque/00-seguimiento-w34.md`](./templates/issues-arranque/00-seguimiento-w34.md) | Seguimiento semanal W34 (post–Seminario 1) |
| [`templates/issues-arranque/01-epic-fundaciones.md`](./templates/issues-arranque/01-epic-fundaciones.md) | Epic: fundaciones MVP |
| [`templates/issues-arranque/02-no-hacer-esta-semana.md`](./templates/issues-arranque/02-no-hacer-esta-semana.md) | Recordatorio: foco Seminario 1 hasta el martes |

Pasos UI: **Issues → New issue →** pegar título/cuerpo (o usar plantilla “Seguimiento semanal” para el de W34).

---

## 4. Primera semana de código real (W34) — solo cuando toque

Orden estricto (del plan):

1. `.env` local desde `.env.example` (sin secretos en Git).  
2. FastAPI: `/health` + OpenAPI visible.  
3. Schema mínimo `tenant` / `project` / `activity`.  
4. Streamlit mostrando health.  
5. Smoke test manual documentado.

Hasta no cerrar el martes de Fase 1: **no** empezar F30, PWA ni motor EVM completo.

---

## 5. Checklist de pie (hoy)

- [ ] Leí este kickoff y el plan Sheets/CSV  
- [ ] Confirmé que trabajo en rama `Dev`  
- [ ] (Opcional) Protegí `main` con Require PR  
- [ ] Creé o dejé listos los 3 Issues de arranque (plantillas abajo)  
- [ ] Prioridad mental: **martes = Seminario 1**, no MVP profundo  
- [ ] Después del martes: abrir seguimiento W34 y primera tarea “API health”
