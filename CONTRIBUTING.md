# Cómo contribuir a UNAB-EVM / OpenEVM

Gracias por tu interés. El proyecto está en etapa de **desarrollo activo (Fase 2)** y admite aportes de la comunidad **bajo control de código**: todo cambio externo se valida antes de llegar a producción (`main`).

> **English:** [CONTRIBUTING.en.md](./CONTRIBUTING.en.md)

Hoy el mantenedor principal puede ser una sola persona; igual el flujo está pensado para que **ningún aporte entre a producción sin revisión y sin pasar por validación**.

---

## Principios

1. **Producción protegida** — `main` solo recibe cambios ya validados en `staging`.
2. **Revisión humana** — todo aporte de terceros entra por **Pull Request** y debe ser aprobado por un mantenedor.
3. **Poco y claro** — preferimos PRs pequeños, con un solo objetivo y documentados.
4. **Trazabilidad** — Issue (qué/por qué) + PR (cómo) + tag semanal cuando corresponda.

```text
Tu fork / rama
      │
      ▼
PR → Dev          (integración; revisión del mantenedor)
      │
      ▼
PR → staging      (validación pre-producción; solo mantenedores)
      │
      ▼
PR → main         (producción; solo mantenedores)
```

Los colaboradores externos **proponen** hacia `Dev`.  
Los mantenedores **promueven** `Dev` → `staging` → `main`.

---

## Antes de codear

1. Lee el [README](./README.md) y, si aplica, [README.en.md](./README.en.md).
2. Revisa reglas de dominio en [`docs/`](./docs/) (`business-rules`, `data-pipeline`, `rbac-matrix`, `architecture`).
3. Busca un Issue abierto o **abre uno nuevo** describiendo la mejora/bug (evita PRs sorpresa).
4. Comenta en el Issue “quiero tomarlo” y espera OK del mantenedor si el cambio es grande.

Buenas primeras tareas (cuando existan labels): `buena-primera-tarea`, `docs`, `frontend`, `backend`.

---

## Flujo de aporte (comunidad)

### 1. Fork y rama

```bash
git clone https://github.com/<tu-usuario>/UNAB-EVM.git
cd UNAB-EVM
git remote add upstream https://github.com/CrisLogOps/UNAB-EVM.git
git fetch upstream
git checkout -b feat/mi-mejora upstream/Dev
```

Nombres de rama sugeridos: `feat/…`, `fix/…`, `docs/…`.

### 2. Desarrollar en caliente pequeño

- Un PR = un propósito.
- No reformatear archivos que no tocaste.
- No subir secretos (`.env`, claves Supabase, etc.).
- Seguir el stack: **FastAPI · Streamlit · Supabase (PostgreSQL)**.

### 3. Commits

Mensajes cortos en imperativo:

```text
feat: registrar GPS en evidencia de avance
fix: bloquear EP sin F30 validado
docs: aclarar Presupuesto Meta en DRAFT
```

### 4. Abrir Pull Request hacia `Dev`

- **Base:** `CrisLogOps/UNAB-EVM` → `Dev`  
- **Compare:** tu rama  
- Completa la plantilla del PR  
- Enlaza el Issue: `Refs #123` o `Closes #123`

### 5. Qué revisa el mantenedor

| Criterio | Pregunta |
|----------|----------|
| Alcance | ¿Resuelve el Issue sin arrastrar temas ajenos? |
| Dominio | ¿Respeta candados EV / laboral / retenciones y RBAC? |
| Seguridad | ¿Sin secretos ni bypass de permisos? |
| Calidad | ¿Se entiende el cambio? ¿Rompe el scaffold actual? |
| Docs | ¿Actualiza docs si cambia una regla o API? |

Puede pedir cambios. El merge a `Dev` **solo lo hace un mantenedor**.

### 6. Camino a producción (no lo haces tú como externo)

1. Mantenedor integra en `Dev` y, si aplica, tag `-dev`.  
2. PR interno `Dev` → `staging` + validación.  
3. PR interno `staging` → `main` + tag de producción `vX.Y.Z`.  

Detalle de versiones: [`docs/versioning.md`](./docs/versioning.md).  
Cadencia semanal: [`docs/weekly-cadence.md`](./docs/weekly-cadence.md).

---

## Qué aportamos con gusto

- Correcciones de bugs y tests.
- Mejoras de docs (ES/EN).
- UI Streamlit / captura de evidencia (alineada a RBAC).
- Reglas de negocio **discutidas en Issue** antes de codificar.
- Traducciones y claridad para PYMEs.

## Qué no aceptamos (por ahora)

- Push o PR directo a `main` o `staging` desde externos.
- Reescrituras masivas sin Issue previo.
- Dependencias pesadas no acordadas.
- Código que omita el candado de evidencia o el laboral “porque es más fácil”.
- Contenido ofensivo o fuera del ámbito del proyecto.

---

## Roles

| Rol | Quién | Puede |
|-----|-------|-------|
| **Mantenedor** | Equipo del repositorio (hoy: admin del proyecto) | Merge a `Dev`/`staging`/`main`, tags, Settings |
| **Colaborador** | Comunidad / interesados | Fork, Issues, PR a `Dev` |
| **Revisor** | Mantenedor (obligatorio en aportes externos) | Aprobar o rechazar PRs |

Aunque haya un solo desarrollador activo, **el control de código se mantiene**: los aportes ajenos no se autopublican en producción.

---

## Comunicación

- **Issues** — bugs, propuestas, seguimiento semanal.  
- **Pull Requests** — revisión de código.  
- Sé concreto, respetuoso y técnico.

---

## Licencia

Al contribuir, aceptas que tu aporte se publique bajo los términos del archivo [`LICENSE`](./LICENSE) (**licencia académica** de esta etapa).  
No implica que el proyecto sea opensource OSI todavía; una licencia comunitaria podrá adoptarse más adelante por acuerdo de los autores.

Ver checklist: [`docs/license-academic.md`](./docs/license-academic.md).
