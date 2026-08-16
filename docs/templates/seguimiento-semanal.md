# Seguimiento semanal — plantilla (copia)

> Usar si no se abre el Issue con la plantilla de GitHub.  
> Pegar en un Issue nuevo o en el canal del equipo.

---

## Metadatos

- **Semana ISO:** `YYYY.Www` (ej. `2026.W34`)
- **Dueño de cadencia:** `CL` / `AS`
- **Rama de trabajo:** `Dev` (sin tocar `main` hasta validar)
- **Estado:** `abierto` | `en-staging` | `validado` | `en-main` | `cerrado`

## Objetivo de la semana (1–3 mejoras)

| # | Alcance (kebab-case) | Código | Tag `-dev` propuesto | Criterio de listo |
|---|----------------------|--------|----------------------|-------------------|
| 1 | | | `v0.2.x-dev.YYYY.Www+COD.alcance` | |
| 2 | | | | |
| 3 | | | | |

## Checklist de continuidad

- [ ] Issue abierto / plantilla completa
- [ ] Trabajo solo en `Dev`
- [ ] Tag(s) `-dev` creados al cerrar cada mejora relevante
- [ ] Checklist “listo para staging” firmada por dueño técnico + negocio
- [ ] PR `Dev` → `staging` (sin force-push)
- [ ] Tag `-staging` tras merge a staging
- [ ] Validación OK (o lista de bloqueos)
- [ ] PR `staging` → `main` solo si validación OK
- [ ] Tag de producción `vX.Y.Z`
- [ ] Actualizar tabla “Últimos tags” en `docs/versioning.md`
- [ ] Cerrar este seguimiento

## Bloqueos / notas

-

## Enlaces

- Commits / PR:
- Tags:
- Docs tocados:
