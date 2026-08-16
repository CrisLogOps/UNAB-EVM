# Control de versiones y tags (semanal)

> **Idioma principal:** español · English summary: [versioning.en.md](./versioning.en.md)  
> **Objetivo:** que cada integrante identifique de inmediato *en qué etapa está el desarrollo*, *qué semana* y *qué mejora* representa el tag.  
> **Continuidad semanal:** [weekly-cadence.md](./weekly-cadence.md) (Issues + ritual sin alterar ramas/tags).

---

## 1. Nomenclatura oficial

```text
vMAJOR.MINOR.PATCH[-canal][+YYYY.Www][+COD.alcance]
```

| Parte | Significado | Ejemplo |
|-------|-------------|---------|
| `MAJOR` | Hito de seminario / ruptura incompatible | `0` = MVP académico, `1` = producto estable post-defensa |
| `MINOR` | Capacidad nueva entregable (ola / pilar) | `2` = Fase 2 operativa (Meta, F30, PWA…) |
| `PATCH` | Ajuste semanal / corrección dentro del mismo MINOR | `0`, `1`, `2`… |
| `canal` | Dónde vive el tag en el flujo de ramas | `dev` \| `staging` \| *(vacío = main/prod)* |
| `YYYY.Www` | Semana ISO del avance | `2026.W33` |
| `COD.alcance` | Responsable + tema corto de la mejora | `CL.presupuesto-meta` |

### Canales (= ramas)

| Canal en el tag | Rama | Significado |
|-----------------|------|-------------|
| `-dev` | `Dev` | Trabajo en curso / integración diaria |
| `-staging` | `staging` | Paquete en **validación** pre-producción |
| *(sin sufijo)* | `main` | **Producción** / referencia estable publicada |

### Códigos de integrante (equipo)

| Código | Integrante | Enfoque típico |
|--------|------------|----------------|
| `CL` | Cristian Lorca | Arquitectura, backend, EVM, DevOps, tags |
| `AS` | Alejandro Suárez | PMBOK, reglas de negocio, validación editorial |
| `XX` | Colaborador externo / pendiente de alta | Usar iniciales acordadas en la semana |

> Si una mejora es compartida: `CL-AS.alcance` (máx. 2 códigos).

### Alcance (kebab-case, corto)

Ejemplos válidos: `presupuesto-meta`, `candado-laboral`, `retenciones`, `pwa-gps`, `rbac-fase2`, `readme-bilingue`, `hotfix-api`.

---

## 2. Ejemplos que todos deben reconocer

| Tag | Lectura en una frase |
|-----|----------------------|
| `v0.1.0` | Baseline Seminario 1 en **producción** (`main`). |
| `v0.2.0-dev.2026.W33+CL.docs-fase2` | Fase 2, semana 33, en **Dev**, docs operativas por Cristian. |
| `v0.2.0-staging.2026.W33` | Mismo paquete pasando **validación** en `staging`. |
| `v0.2.0` | Paquete promovido a **producción** (`main`). |
| `v0.2.1-dev.2026.W34+AS.reglas-f30` | Semana 34: mejora de reglas F30 liderada por Alejandro en Dev. |
| `v0.2.2-dev.2026.W34+CL.pwa-gps` | Misma semana, otra mejora (PWA) en Dev. |

Regla de lectura rápida:

```text
v0.2.1 -dev .2026.W34 +AS.reglas-f30
 │  │  │    │           │
 │  │  │    │           └─ quién + qué
 │  │  │    └─ semana del avance
 │  │  └─ canal (Dev / staging / prod)
 │  └─ número de mejora dentro de la fase
 └─ fase / generación del producto
```

---

## 3. Ritmo semanal (obligatorio)

Cada semana ISO el equipo:

1. **Cierra mejoras en `Dev`** y crea tag(s) `-dev` por mejora relevante (o un tag semanal agregado si hubo muchas micro-correcciones).
2. **Promueve a `staging`** lo validable → tag `-staging` con la **misma** `vMAJOR.MINOR.PATCH` y la misma semana.
3. **Tras QA OK**, merge a `main` → tag **sin canal** (`vX.Y.Z`) = versión de producción de esa semana/ola.
4. Actualiza la tabla “Últimos tags” al final de este archivo (PR corto).

```text
Lun–Jue   desarrollo en Dev     →  tags …-dev.YYYY.Www+COD.alcance
Vie       freeze candidato      →  merge Dev → staging + tag …-staging.YYYY.Www
          validación / demo
Dom/Lun   si OK                 →  merge staging → main + tag vX.Y.Z
```

Si la validación falla: **no** se crea tag de producción; se corrige en `Dev` con `PATCH+1` y se reintenta en `staging`.

---

## 4. Cómo crear un tag (comandos)

```bash
# Estar en la rama correcta
git checkout Dev
git pull origin Dev

# Tag anotado (recomendado)
git tag -a v0.2.1-dev.2026.W34+CL.pwa-gps -m "W34: captura offline-first + GPS (CL)"

# Publicar
git push origin v0.2.1-dev.2026.W34+CL.pwa-gps

# Listar
git tag -l 'v0.2.*' --sort=-v:refname
```

Promoción a staging / main: **mover el mismo número de versión** cambiando solo el canal (o quitándolo en prod), no reinventar el MINOR a menos que sea una capacidad nueva.

---

## 5. Qué NO hacer

- No reutilizar un tag ya empujado (los tags son inmutables).
- No poner espacios ni tildes en el tag.
- No usar solo fechas (`2026-08-16`) sin `vX.Y.Z` y canal.
- No saltar `staging` hacia `main` en avances semanales normales.

---

## 6. Últimos tags (línea base)

| Tag | Rama | Semana | Responsable | Notas |
|-----|------|--------|-------------|-------|
| `v0.1.0` | `main` | — | Equipo | Cierre conceptual Seminario 1 / scaffold estable previo a Fase 2 docs |
| `v0.2.0-dev.2026.W33+CL.docs-fase2` | `Dev` | 2026.W33 | CL | Pilares operativos + README bilingüe |
| `v0.2.0-staging.2026.W33` | `staging` | 2026.W33 | Equipo | Puerta de validación Dev → main |
| `v0.2.0` | `main` | 2026.W33 | Equipo | Producción: docs Fase 2 + flujo de ramas + i18n README |

Actualizar esta tabla en cada tag de producción o al cierre de semana.
