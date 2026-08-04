# Data Pipeline — Importación de Línea Base (borrador)

## Columnas mínimas (CSV / Excel)

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `activity_code` | string | Código EDT / WBS |
| `activity_name` | string | Nombre de la actividad |
| `start_date` | date | Fecha planificada de inicio |
| `finish_date` | date | Fecha planificada de término |
| `budget_pv` | decimal | Presupuesto planificado ($PV$) |
| `weight` | decimal (opc.) | Ponderación |
| `area_code` | string (opc.) | Área responsable |

## Validaciones

1. Schema y tipos
2. `start_date` ≤ `finish_date`
3. Consistencia de $\sum PV$ con presupuesto de proyecto
4. Persistencia en `draft` hasta freeze v1.0
