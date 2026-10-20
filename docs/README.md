# Documentación del proyecto

| Documento | Contenido |
|-----------|-----------|
| **[integration/](./integration/README.md)** | **Guía de factibilidad de integración** — probabilidad por componente, dependencias y plan por olas |
| [Documento-Base-README-para-Revision.pdf](./Documento-Base-README-para-Revision.pdf) | **PDF de trabajo para Alejandro** — línea base editorial desde el README |
| [Documento-Base-README-para-Revision.html](./Documento-Base-README-para-Revision.html) | Fuente HTML del PDF (regenerable) |
| [architecture.md](./architecture.md) | ADRs Fase 2, PWA offline-first + GPS, separación Streamlit/PWA |
| [rbac-matrix.md](./rbac-matrix.md) | Matriz de permisos (F30, retenciones, DRAFT Meta, Dashboard-First) |
| [business-rules.md](./business-rules.md) | Candado EV, Candado Laboral F30/F30-1, retenciones 5–10% |
| [data-pipeline.md](./data-pipeline.md) | Presupuesto Meta (APU real): DRAFT → freeze v1.0 → replan |
| [versioning.md](./versioning.md) | **Tags semanales** — nomenclatura, canales Dev/staging/main, códigos de integrante |
| [versioning.en.md](./versioning.en.md) | Versioning tags (English summary) |
| [weekly-cadence.md](./weekly-cadence.md) | **Cadencia semanal** — solicitar seguimiento desde Dev sin alterar ramas/tags |
| [templates/seguimiento-semanal.md](./templates/seguimiento-semanal.md) | Plantilla de Issue / coordinación semanal |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | **Aportes de la comunidad** — PR a Dev, revisión, camino a producción |
| [license-academic.md](./license-academic.md) | **Licencia académica** — checklist; foco MVP, OSI diferido |
| [flujo-fases-f1-f7.md](./flujo-fases-f1-f7.md) | **Flujo válido del proyecto** — 56 pasos Rev3 (PMBOK adaptado), gates y qué se puede probar |
| [2026-09-13_Flujo_Proceso_Proyecto_Adjudicacion_a_Garantias_Rev3.xlsx](./2026-09-13_Flujo_Proceso_Proyecto_Adjudicacion_a_Garantias_Rev3.xlsx) | Libro canónico (Resumen_Fases + Flujo_Detallado) |
| [esquema-validacion-pmbok-iso-datos.md](./esquema-validacion-pmbok-iso-datos.md) | **Validación por capas** — ISO 9001, ágil diario y datos personales sobre el Rev3 |
| [2026-10-20_validacion-funcionalidades.csv](./2026-10-20_validacion-funcionalidades.csv) | **Validación de funcionalidades** — una fila por función, con el flujo y el dato en la misma línea |
| [2026-10-20_prompt-validacion-funcionalidades.md](./2026-10-20_prompt-validacion-funcionalidades.md) | Prompt para pasar ese CSV a Gemini |
| [2026-10-20_base-gemini-validacion-modos.md](./2026-10-20_base-gemini-validacion-modos.md) | Respaldo de hechos del barrido por fases y modos |
| [2026-10-20_Esquema_Validacion_PMBOK_ISO9001_Datos.xlsx](./2026-10-20_Esquema_Validacion_PMBOK_ISO9001_Datos.xlsx) | Matriz para confirmar cada fase, inventario de datos y bitácora |
| [local-mvp.md](./local-mvp.md) | Arranque local (Docker + API + Next) y SQL de prueba para Supabase |
| [despliegue-railway.md](./despliegue-railway.md) | **GitHub + Railway** — por qué no Pages/Netlify solo; cómo publicar para trabajar con un compañero |
| [requisitos-minimos-servidor-mvp.md](./requisitos-minimos-servidor-mvp.md) | **Ficha para pedir un servidor** — arquitectura MVP, lenguajes, Postgres, sizing y checklist de validación |
| [templates/issues-arranque/](./templates/issues-arranque/) | Textos de Issues para pegar en GitHub (W34 + epic + aviso foco) |
| [roadmap.md](./roadmap.md) | Cronograma Seminario 1 → Seminario 2 |
| `api-openapi.yaml` | Contrato OpenAPI (pendiente de generación) |
| `thesis/` | Anexos / documento formal fusionado con el original del proyecto |

## Guía rápida: ¿qué tan probable es integrar X?

1. Abrir [`integration/README.md`](./integration/README.md)
2. Ubicar el componente en [`integration/mapa-ecosistema.md`](./integration/mapa-ecosistema.md)
3. Leer probabilidad en [`integration/matriz-factibilidad.md`](./integration/matriz-factibilidad.md)
4. Seguir orden en [`integration/plan-por-olas.md`](./integration/plan-por-olas.md)

## Regenerar el PDF de revisión

```bash
cd Desarrollo
python3 -m venv .venv-docs && .venv-docs/bin/pip install markdown
.venv-docs/bin/python scripts/generate_readme_pdf.py
google-chrome --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PWD/docs/Documento-Base-README-para-Revision.pdf" \
  "file://$PWD/docs/Documento-Base-README-para-Revision.html"
```

Ver también el [README](../README.md) en la raíz del repositorio.
