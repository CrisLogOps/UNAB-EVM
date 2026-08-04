# Reglas de negocio (borrador)

## Candado metodológico — bloqueo de $EV$

El Valor Ganado ($EV$) **no se contabiliza** si el avance reportado carece de evidencia documental en estado `validada`.

```text
EV := f(% avance, presupuesto de actividad)
     iff evidencia.estado = "validada"
     else EV permanece sin incremento (bloqueo)
```

## Baseline — freeze y replan

1. Importación CSV/Excel → estado `draft`
2. `baseline.freeze` → versión **v1.0** inmutable
3. Desvíos (Curva S / decisión PMO) → `baseline.replan` → **v2.0+**
