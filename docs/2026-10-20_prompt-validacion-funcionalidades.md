# Prompt — validación de funcionalidades

Adjunta `2026-10-20_validacion-funcionalidades.csv` y pega el bloque siguiente.

```
Valida las funcionalidades de OpenEVM con el CSV adjunto. Ese archivo es la única lista. Tiene 41 filas, en orden de ensayo: primero el modo individual, después el colaborativo y al final la vista del cliente.

Cada fila ya junta tres cosas. No las separes en otro documento, otra hoja ni otro inventario:
- fase: el paso del flujo actual (F0 a F7).
- funcion y que_hacer: la acción concreta en la pantalla.
- dato: el dato que se mira en esa misma acción.

Recorre las filas de arriba hacia abajo. Para cada id completa solo la columna lectura, con una de estas tres frases:
- Probada: la función existe y el resultado_esperado se puede comprobar en esa ruta.
- Sin función: la fila pide una pantalla que el flujo nombra y la plataforma no tiene.
- N/A: esa función no corresponde a ese modo.

No cambies id, modo, fase, funcion, ruta, que_hacer, dato ni resultado_esperado.
No llenes resultado_ensayo ni veredicto. Esas columnas las completa quien ejecute la fila en la plataforma.
No copies texto de PMBOK, ISO 9001 ni de la Guía Práctica de Ágil.
No inventes módulos ni conviertas al cliente en un usuario.

Cuando termine el recorrido, responde con el mismo CSV, más la columna lectura, y cierra con tres números: cuántas filas quedan Probada, cuántas Sin función y cuántas N/A.

Si después te pego lo que vi en una pantalla, escribe esa observación en resultado_ensayo de esa fila y propone un veredicto solo entre Cubierto, Parcial, Brecha, N/A del modo o Por ensayar. Devuelve otra vez el CSV completo, no un resumen aparte.
```
