# Ciclo F0–F7 — alineación OpenEVM (Rev3)

Fuente del libro: `docs/templates/2026-09-13_Flujo_Proceso_Proyecto_Adjudicacion_a_Garantias_Rev3.xlsx`, hoja **Resumen_Fases** (F1–F7) y **Flujo_Detallado**.

Este archivo es el historial de alineación (el propio libro pide no guardar el changelog dentro del xlsx). El mapa operable vive en Inicio (`/demo`), bloque **Ciclo del contrato**.

## Cómo se confirma el proceso

El Excel describe el ciclo contractual PMBOK adaptado (adjudicación → garantías). OpenEVM **no copia el orden ciego del Excel**: confirma cada fase con lo que la plataforma ya hace y deja explícito lo previsto.

| Orden real en plataforma | Fase del libro | Qué quedó alineado |
|---|---|---|
| Setup 0 (antes del contrato) | **F0** (extensión OpenEVM) | Tenant, áreas, perfiles, equipo |
| Cliente y carpeta de obra | **F1.1–F1.4** | Cliente, proyecto, equipo en la obra |
| Kickoff interno dual | **F1.5 + F2.1–F2.2** | Propuesta de Comercial + comentario de **todas** las áreas + juicio del gestor |
| Kickoff cliente | **F2.4** | Día 1; abre el cronograma |
| EDT + calendario + BAC | **F3.1–F3.3** | Gantt CSV y presupuesto con visto bueno |
| Avance con evidencia | **F4.5–F4.6 + F5.1** | Terreno (foto) y escritorio (PDF/planilla) según responsable del cronograma |
| Control EVM | **F5.2–F5.4** | Curva S, CPI/SPI, candado EV, desvío vs línea base |
| Cierre y garantías | **F6–F7** | Documentados; Conocimiento cubre en parte F6.9 |

F4 y F5 corren en paralelo, igual que en la leyenda del libro.

## Resumen_Fases → estado

| Fase | Hito de salida del libro | En OpenEVM hoy |
|---|---|---|
| F1 | Contrato y kickoff Comercial→operaciones | Listo en sustancia: cliente, propuesta inicial, traspaso. Firma/boletas: solo texto en kickoff |
| F2 | Día 1 con el cliente, charter y RACI | Listo: áreas comentan, gestor cierra, kickoff cliente. Interesados extra: no |
| F3 | Línea base alcance-tiempo-costo | EDT, Gantt y BAC listos. Riesgos, calidad, compras y freeze v1.0: previstos |
| F4 | Avance físico y financiero reportado | Avance + evidencia (terreno y escritorio). Permisos, OC, EP: previstos |
| F5 | Alcance 100% verificado | EVM y candado listos. Variaciones económicas y replan v2: previstos |
| F6 | TOP + liquidación + dossier interno | Conocimiento (lecciones de kickoff). TOP, actas y finiquito: previstos |
| F7 | Garantías liberadas y archivo | Previsto. El kickoff ya permite anotar garantías, sin mesa de tickets |

## Cambios de producto que este mapa incorpora

- Kickoff interno de **dos partes**: Comercial adjunta propuesta; **cada área** deja registro; el gestor sintetiza la propuesta al cliente.
- Esos comentarios van a **Conocimiento** (`/knowledge`), sin correlacionar proyectos todavía.
- Evidencia de avance **desde escritorio** (PDF, planilla, informe) y desde faena (cámara o archivo), según el responsable de la partida.
- El valor ganado solo cuenta con evidencia **validada**.

## Tabla paso a paso

Ver CSV junto al libro: [`templates/openevm-alineacion-f1-f7.csv`](./templates/openevm-alineacion-f1-f7.csv).
