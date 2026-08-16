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
