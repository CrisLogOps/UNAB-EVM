# Flujo válido del proyecto — Rev3 (PMBOK adaptado)

Fuente canónica: [`2026-09-13_Flujo_Proceso_Proyecto_Adjudicacion_a_Garantias_Rev3.xlsx`](./2026-09-13_Flujo_Proceso_Proyecto_Adjudicacion_a_Garantias_Rev3.xlsx)

Hojas que mandan: **Resumen_Fases**, **Flujo_Detallado** y **Leyenda**. El diagrama visual es la misma lectura gráfica.

Este libro **es el proceso de un proyecto en OpenEVM**. No es una guía opcional ni un recorte de lo que ya se puede probar. Los 56 pasos (F1–F7) entran a la plataforma aunque el módulo todavía no esté listo para ensayo. F0 (alta de tenant) es el único prerrequisito de software, previo a la adjudicación.

El mapa operable vive en Inicio (`/demo`), bloque **Flujo válido del proyecto**. El grafo está versionado en `apps/web/src/lib/process-rev3.json`.

## Qué queda fijado

- Ciclo contractual: adjudicación (Comercial) → kick-off de partida (Día 1) → planificación → ejecución ∥ monitoreo → cierre (TOP) → postventa/garantías.
- Base conceptual: grupos de proceso y áreas de conocimiento de PMBOK® 6.ª / 7.ª / 8.ª, adaptados a administración de contratos. El libro no reproduce texto de PMI.
- Cada fila de Flujo_Detallado es un nodo de workflow: predecesor, sucesor y, si aplica, regla de bifurcación.
- F4 (Ejecución) y F5 (Monitoreo y control) **corren en paralelo**.
- Un documento de evidencia del libro se pide cuando el paso lo exige. En kickoff interno (F2.1) la plataforma pide razones por escrito; el archivo es opcional para poder probar el flujo.

## Fases (Resumen_Fases)

| Fase | Pasos | Grupo PMBOK | Hito de salida del libro |
|---|---|---|---|
| **F0** | 1 | Previo (OpenEVM) | Tenant, áreas y puestos listos |
| **F1** | 5 | Pre-proyecto | Contrato y kick-off Comercial → operaciones |
| **F2** | 5 | Iniciación | Día 1 con el cliente, charter y organigrama |
| **F3** | 9 | Planificación | Línea base alcance-tiempo-costo aprobada |
| **F4** | 10 | Ejecución | Avance físico y financiero reportado a control |
| **F5** | 11 | Monitoreo y control (∥ F4) | Alcance contratado (con variaciones) al 100% |
| **F6** | 10 | Cierre | TOP aceptado, liquidación y dossier interno |
| **F7** | 6 | Post-cierre / transición | Garantías liberadas y archivo |

Total del libro: **56 pasos**. F0 no cuenta en ese total.

## Puntos de decisión (13 gates)

Nodo con más de una salida. En Inicio se marcan como **Decisión**.

| ID | Paso del libro | Si no / loop | Si sí |
|---|---|---|---|
| F1.2 | Revisión de condiciones contractuales | Vuelve a negociación (F1.2) | F1.3 |
| F2.1 | Revisión de antecedentes técnicos | Inconsistencia: escala a Comercial (F2.1) | F2.2 |
| F3.9 | Aprobación de línea base | Rechazo → F3.1. También recibe F5.7 | F4.1 |
| F4.2 | Gestión de permisos y permisología | Permiso rechazado: reintenta F4.2 | F4.3 |
| F5.1 | Medición de avance / candado EV | Evidencia inválida → F4.5 | F5.2 |
| F5.3 | Control SPI/CPI | Fuera de umbral → F5.4 | F5.5 |
| F5.6 | Acuerdo económico de la variación | Sin acuerdo → F5.1 | F5.7 |
| F5.7 | Cambio y actualización de línea base | Aprobado → F3.9; rechazado → F5.8 | — |
| F5.11 | Verificación de cierre de alcance | Alcance bajo 100% → F4.5 | F6.1 |
| F6.2 | Recepción provisoria | Observaciones → F6.3 | F6.4 |
| F6.3 | Subsanación de observaciones | Loop a F6.2 | — |
| F6.4 | Entrega del TOP al cliente | TOP incompleto: reintenta F6.4 | F6.5 |
| F7.4 | Gestión de solicitudes de garantía | Loop durante el período | F7.5 al expirar |

## Prueba vs flujo

La plataforma **no espera** a tener los 56 módulos para seguir ensayando F1–F2, EDT, presupuesto, avance y EVM. Eso no saca del flujo a riesgos, compras, freeze, TOP ni mesa de garantías: quedan como siguiente paso PMBOK, con estado *en el flujo · módulo pendiente*.

Tabla ID a ID: [`templates/openevm-alineacion-f1-f7.csv`](./templates/openevm-alineacion-f1-f7.csv).
