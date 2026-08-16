# Cadencia semanal — continuidad sin alterar el desarrollo actual

> **Principio:** el seguimiento se pide y registra **por encima** del código (Issues + plantillas).  
> No se reescriben ramas, no se mueven tags antiguos y no se obliga a redeploy: `Dev` / `staging` / `main` siguen igual.

Documento hermano: [versioning.md](./versioning.md) (nomenclatura de tags).

---

## 1. Estrategia (qué cambia / qué no)

| Sí (continuidad) | No (no alterar GitHub actual) |
|------------------|-------------------------------|
| Abrir un **Issue de seguimiento semanal** desde la UI de GitHub | Renombrar o borrar `Dev`, `staging`, `main` |
| Completar checklist de la semana (mejoras, dueño, tag propuesto) | Force-push o reescribir historial |
| Crear tags **nuevos** al cerrar mejoras en `Dev` | Reetiquetar commits ya publicados |
| Promover a `staging` / `main` solo cuando el Issue lo autorice | Mezclar hotfixes directos a `main` como hábito |
| Actualizar la tabla “Últimos tags” en `versioning.md` en el PR de cierre | Cambiar el stack o la estructura de carpetas por el solo hecho de trackear |

Flujo operativo (igual que ya definimos):

```text
Issue semanal (solicitud + checklist)
        │
        ▼
Trabajo en Dev  →  tag …-dev.YYYY.Www+COD.alcance
        │
        ▼
Issue marca “listo para staging”  →  PR Dev → staging  →  tag …-staging…
        │
        ▼
Issue marca “validado”  →  PR staging → main  →  tag vX.Y.Z
```

---

## 2. Cómo solicitar el seguimiento desde el ambiente de desarrollo

### Opción A — GitHub Issue (recomendada, sin tocar código)

1. En el repo: **Issues → New issue → “Seguimiento semanal”**.  
2. Completar semana ISO (`YYYY.Www`), responsables (`CL` / `AS`) y mejoras previstas.  
3. Asignar al dueño de la semana (rotativo o co-dueños).  
4. El Issue es el **tablero de continuidad**: comentarios = avance diario; cierre = semana cerrada.

Plantilla automática: [`.github/ISSUE_TEMPLATE/seguimiento-semanal.yml`](../.github/ISSUE_TEMPLATE/seguimiento-semanal.yml).

Enlace directo (cuando el repo esté en GitHub):

```text
https://github.com/CrisLogOps/UNAB-EVM/issues/new?template=seguimiento-semanal.yml
```

### Opción B — Plantilla en docs (si aún no usan Issues)

Copiar [`templates/seguimiento-semanal.md`](./templates/seguimiento-semanal.md) a un Issue manual o a un mensaje de coordinación (correo/chat). Misma estructura; cero impacto en ramas.

### Opción C — Recordatorio desde la máquina de desarrollo (local)

Desde la carpeta del repo en `Dev`:

```bash
# Solo lectura: muestra semana ISO y sugiere el próximo tag (no empuja nada)
date +%G.W%V
git describe --tags --abbrev=0 2>/dev/null || true
git status -sb
```

No automatiza merge ni push: evita alterar remoto por accidente.

---

## 3. Ritual semanal mínimo (30–45 min)

| Momento | Acción | Artefacto |
|---------|--------|-----------|
| **Inicio de semana** | Abrir Issue “Seguimiento semanal” | Issue abierto |
| **Durante la semana** | Commits solo en `Dev`; un tag `-dev` por mejora relevante | Tags nuevos |
| **Cierre candidato** | En el Issue: checklist “listo para staging” | PR `Dev` → `staging` |
| **Validación** | Probar / revisar en `staging` | Tag `-staging` |
| **Producción** | Si OK: PR `staging` → `main` | Tag `vX.Y.Z` + cerrar Issue |

Si falla la validación: el Issue sigue abierto; se corrige en `Dev` con `PATCH+1`; **no** se crea tag de producción.

---

## 4. Roles en el seguimiento (sin cambiar RBAC del producto)

| Rol de la semana | Quién | Responsabilidad |
|------------------|-------|-----------------|
| **Dueño de cadencia** | `CL` o `AS` (rotar) | Abre/cierra el Issue, propone tags |
| **Dueño técnico** | `CL` | Tags, PRs de ramas, consistencia Dev→staging→main |
| **Dueño de negocio** | `AS` | Criterios de aceptación de la mejora, texto/reglas |

---

## 5. Criterio de “no alterar el desarrollo actual”

Antes de cualquier acción de cierre semanal, verificar:

1. ¿Estoy creando un tag **nuevo** (no moviendo uno existente)?  
2. ¿El código de producto no requiere rollback de `main`?  
3. ¿La promoción es por **PR** (revisable) y no por push directo a `main`?  
4. ¿El Issue documenta el “por qué” de la semana?

Si alguna respuesta es no → parar y corregir el proceso, no el historial.

---

## 6. Arranque inmediato (esta semana)

1. Abrir el primer Issue con plantilla **Seguimiento semanal** para `2026.W33` o `2026.W34`.  
2. Listar mejoras ya hechas (docs Fase 2, READMEs, staging, versionado) como “cerradas / baseline”.  
3. Declarar 1–3 mejoras objetivo de la próxima semana con `COD.alcance`.  
4. Seguir trabajando solo en `Dev` hasta marcar “listo para staging”.
