# Base para Gemini — checklist de validación por fases y modos

El instrumento concreto de validación es [`2026-10-20_validacion-funcionalidades.csv`](./2026-10-20_validacion-funcionalidades.csv), con el prompt en [`2026-10-20_prompt-validacion-funcionalidades.md`](./2026-10-20_prompt-validacion-funcionalidades.md). Flujo, función y dato van en la misma fila. Este archivo queda como respaldo de hechos.

Archivo de entrada anterior. No es el checklist. Gemini debe generar un libro de cálculo a partir del prompt y de los hechos de este archivo.

No modifica el libro Rev3 `docs/2026-09-13_Flujo_Proceso_Proyecto_Adjudicacion_a_Garantias_Rev3.xlsx`. No reemplaza `esquema-validacion-pmbok-iso-datos.md` ni su Excel de capas. Este barrido pregunta otra cosa: si cada fase, cada módulo y cada tarea de un proyecto estándar se puede validar en los modos individual, colaborativo y cliente.

## Cómo usarlo

1. En Gemini, abre un chat nuevo y adjunta este archivo.
2. Pega el prompt de la sección siguiente, sin cambiar los hechos.
3. Pide el resultado como libro de cálculo (`.xlsx`), con una hoja por bloque indicado.
4. Deja vacías las columnas de ensayo. Esas las llena quien recorra la plataforma.

## Prompt

```
Eres el redactor del checklist de validación de OpenEVM. Genera un libro de cálculo en español, con las hojas y columnas de este prompt. Usa solo los hechos del archivo adjunto. Si un paso del Rev3 no tiene pantalla, la fila existe igual y la lógica queda en "No todavía".

No reproduzcas texto de PMBOK, de ISO 9001 ni de la Guía Práctica de Ágil. Cita el grupo de proceso, el número de cláusula o la sección, y parafrasea el control en una frase propia. No inventes módulos (cBox, código QR de vivienda, benchmark, CRM de postventa, módulo de hormigón, Last Planner como producto). No conviertas al cliente en un rol de usuario ni en un selector de toda la cartera.

El libro tiene seis hojas.

Hoja Como_usar
- Qué valida este libro: el barrido de un proyecto estándar en tres modos.
- Orden del ensayo: individual, luego colaborativo, luego vista de cliente de esa misma obra.
- Veredictos permitidos, vacíos hasta el ensayo: Cubierto, Parcial, Brecha, N/A del modo, Por ensayar.
- Una fase queda con lógica validable solo si, en ese modo, hay una pantalla, un dato que se guarda y un resultado observable. Marcar el paso en Inicio no basta.
- F4 y F5 se ensayan en paralelo. El cliente no ve presupuesto, margen, BAC, CPI ni SPI.

Hoja Logica_capas
Una fila por fase F0 a F7. Columnas:
Fase, Nombre, Grupo PMBOK, Pregunta de lógica, Control de calidad del flujo (cláusula ISO, sin citar el texto), Superficie ágil si aplica (sección de la Guía, sin citar el texto), Toque EVM, ¿La lógica se puede validar hoy?, Qué lo haría no validable, Resultado del ensayo, Veredicto, Nota.
La columna "¿La lógica se puede validar hoy?" la completas con Sí, No todavía o Solo en parte, según los hechos. El resultado del ensayo y el veredicto quedan vacíos.

Hoja Checklist_fases
Una fila por cada paso F0.1 y F1.1 a F7.6, repetida tres veces (modos individual, colaborativo y cliente). Son 57 pasos × 3 = 171 filas. No fusiones modos en una sola fila. Columnas:
ID, Fase, Nombre del paso, Grupo PMBOK, ¿Es gate?, Modo, Ruta de prueba, Tarea del ensayo, Resultado esperado en ese modo, Dato que debe quedar, ¿Toca EVM?, ¿Toca calidad?, ¿Toca el tablero diario?, Lógica validable (Sí / No todavía / N/A del modo), Estado de plataforma al 2026-10-20, Resultado del ensayo, Evidencia, Veredicto, Nota.
"Estado de plataforma" sale de los hechos (listo para ensayar, parcial, módulo pendiente, o N/A del modo). Las cuatro columnas finales quedan vacías.

Hoja Barrido_modulos
Una fila por cada tarea de cada módulo, repetida en los tres modos. Columnas:
Módulo, Ruta, Tarea, Permiso, Modo, ¿La tarea está en ese modo?, Qué debe ocurrir, Qué no debe verse, Dato guardado, Resultado del ensayo, Veredicto, Nota.
En individual, las tareas de Personas, Puestos, Áreas, Administración y En la obra quedan N/A del modo. En cliente, solo entran las tareas de lectura de la vista /cliente; el resto de módulos de la empresa queda N/A del modo, aunque el menú de la empresa siga visible para quien previsualiza.

Hoja Calidad_flujo
El control de calidad se valida recorriendo el flujo, no con un catálogo aparte. Una fila por cada acción, en los tres modos. Acciones mínimas:
aplicar Liberación de partida; aplicar Condiciones del frente; marcar conforme; marcar no aplica solo en el ítem que no frena; intentar no aplica en un ítem que frena y comprobar que no existe ese botón; no conforme sin nota y comprobar que no abre; no conforme con nota de al menos 8 caracteres; ver responsable, plazo y decisión; ver en Inicio que esa partida no suma valor ganado; cerrar sin nota ni archivo y comprobar que no cierra; cerrar con nota; ver el cierre en el historial; ver la columna Calidad del cliente en Sin protocolo, Protocolo en curso, No conformidad abierta y Liberada.
Columnas: Acción, Modo, Ruta, Resultado esperado, ¿Frena el EV?, Cláusula de control (número), Resultado del ensayo, Veredicto, Nota.
Separa el plan de calidad (F3.6, documento de planificación, todavía sin módulo) del protocolo de partida (F4.8 y F5.8, pantalla /calidad, ya ensayable).

Hoja Proyecto_estandar
Guion único para no saltar de obra. Columnas: Orden, Modo, Paso, Ruta, Hecho observable, Listo cuando, Resultado del ensayo.
El guion usa una sola razón social, un solo proyecto y el cronograma de esa obra. Cubre alta o confirmación del modo, cliente, kickoff, presupuesto según la segregación del modo, cronograma, avance con evidencia, calidad sobre una partida, lectura EVM en Inicio, libro de obra, y al final la vista de ese cliente. No pidas datos de otras obras.

Reglas de modo que no puedes contradecir:
- Individual: una persona, sin pantallas de personas, puestos, áreas ni equipo de obra. La misma persona carga y cierra. La evidencia de avance queda validada por esa persona. El libro de obra es autocontrol.
- Colaborativo: hay contraparte. Finanzas propone el presupuesto, el gestor revisa y administrador o comercial aprueba. La evidencia de terreno queda en revisión hasta que otro rol la valida. El protocolo de calidad todavía no obliga a que otra persona cierre la no conformidad.
- Cliente: no es un tercer alta de empresa ni un usuario mandante. Es la vista /cliente?id= del cliente de la obra. Lista solo las obras de esa razón social. La ficha es de lectura. Muestra código, partida, tipo, inicio, término, avance y calidad. No muestra montos.

Si un hecho dice "módulo pendiente", no lo marques Cubierto. Si un hecho dice que un texto interno de la plataforma está viejo, manda el hecho de este archivo, no ese texto.
```

## Hechos que Gemini debe respetar

Fecha de estos hechos: 20 de octubre de 2026. Fuente de los IDs: `apps/web/src/lib/process-rev3.json` y el paso de plataforma F0.1. La plataforma de prueba es la app web en `UNAB-EVM/apps/web`.

### Proyecto estándar del ensayo

Una razón social, un RUT de cliente y una obra con cronograma. En el demo local eso ya existe como Cliente Validación SpA (`cli-demo`, RUT 76.999.888-7) y Mejoramiento Ruta Demo (`prj-demo`, código OBRA-MVP). El ensayo puede usar esa obra o una obra nueva del mismo tipo. No se mezclan clientes en la vista del mandante.

Alta del cliente: razón social y RUT obligatorios. Nombre y correo de contacto opcionales. No hay cuenta de acceso para el mandante. Quien entra a la vista de cliente es la empresa, para previsualizar.

### Tres modos

| Modo | Qué es | Qué cambia el control |
|---|---|---|
| Individual | `operatingMode` individual, o tamaño de empresa independiente. Una persona. | Oculta `/admin`, `/users`, `/profiles`, `/areas` y `/teams`. Misma persona carga, revisa y cierra. La evidencia de avance se guarda validada. Libro de obra en autocontrol. |
| Colaborativo | Dos o más personas, áreas y puestos. | Esas pantallas existen. El presupuesto se parte en proponer, revisar y aprobar. La evidencia de terreno queda `uploaded` hasta que un rol con permiso de aprobar la valida. |
| Cliente | Vista `/cliente?id=` y, si se abre una obra, `/cliente?id=&obra=`. No es un modo de alta ni un rol `viewer`. | Solo las obras de ese `clientId`. Lectura. Sin BAC, margen ni estados de pago. El menú de la empresa puede seguir visible porque quien previsualiza es la constructora. |

`viewer` no es el mandante. Su navegación no sustituye esta vista.

### EVM que el checklist tiene que poder observar

- PV sale de las fechas de la partida contra la fecha de corte.
- EV de una partida cuenta cuando hay un reporte con `evidenceStatus` validado. En colaborativo, la evidencia de terreno no entra sola. En individual, el registro la deja validada.
- Una no conformidad bloqueante y abierta pone el avance de esa partida en cero para el EV, aunque el porcentaje de la fila exista. En Inicio se ve el aviso y la etiqueta "Frenada por calidad". Al cerrarla, esa etiqueta sale. El EV sigue sujeto a la evidencia validada.
- AC se anota en el avance o en Gastos. CPI = EV / AC. SPI = EV / PV. Esos índices están en Inicio.
- El candado laboral F30 es un candado de pago. No es la no conformidad de faena.
- El cliente no ve estos montos ni estos índices.

### Calidad: dos capas distintas

Plan de calidad (F3.6). Sigue siendo un paso del libro. No hay pantalla de plan de gestión de calidad. La lógica de ese paso no es validable todavía.

Protocolo de partida (F4.8 y F5.8). Sí hay pantalla `/calidad`.

- Plantillas fijas: "Liberación de partida" (cuatro ítems que frenan) y "Condiciones del frente" (el ítem de caída no frena; el resto sí).
- No conforme exige una nota de al menos 8 caracteres. Abre una no conformidad con responsable, plazo y una decisión "Abierta desde el protocolo."
- Cerrar exige una nota de al menos 8 caracteres o un nombre de archivo. Queda la decisión "Cerrada con respaldo." y el texto del cierre sigue visible.
- El archivo guarda el nombre, no el binario. "Tomar ubicación" pide la posición al dispositivo y, si llega, la muestra en el ítem.
- En individual la misma persona puede cerrar. En colaborativo el cierre tampoco exige hoy otro usuario.
- La columna Calidad del cliente usa cuatro estados: Sin protocolo, Protocolo en curso, No conformidad abierta, Liberada.
- El texto interno de `process-lifecycle.ts` que dice que las no conformidades formales siguen pendientes está viejo. El hecho vigente es el de esta sección.

ISO 9001, solo números, sobre este flujo: 8.1 planificación operacional, 8.5 provisión, 8.6 liberación, 8.7 salida no conforme, 9.1 seguimiento, 10.2 no conformidad y acción correctiva. El plan que falta es 8.1 en su documento; el protocolo que existe cubre 8.6, 8.7 y 10.2 en la partida.

### Ágil, solo donde ya hay superficie

El ciclo del contrato sigue el orden predictivo F1–F3 y F6 (Guía §§ 3.1.6 a 3.1.8). El día a día es el Libro de obra, tablero abierto / en faena / cerrado (Guía § 2.3). El modo individual es un equipo de una persona (Guía § 4.3). Ese tablero no reemplaza F3.9 ni F6.2. No se abre un sprint ni un Last Planner como producto.

### Fases

| Fase | Nombre | Grupo PMBOK | Salida del libro | Lógica validable hoy |
|---|---|---|---|---|
| F0 | Alta del tenant | Previo a la plataforma | Empresa lista para una adjudicación | Sí en individual y colaborativo. N/A en cliente. |
| F1 | Adjudicación y formalización contractual | Pre-proyecto | Contrato y traspaso comercial a operaciones | Solo en parte: cliente, condiciones y equipo. El PDF de adjudicación y las boletas no están. |
| F2 | Inicio del proyecto | Iniciación | Día 1 con el cliente | Solo en parte. El Día 1 abre el calendario. Interesados extra y el acta PDF no están. |
| F3 | Planificación | Planificación | Línea base alcance-tiempo-costo | Solo en parte: EDT, fechas y presupuesto. Riesgos, compras, plan de calidad, plan de informes, plan único y freeze de línea base no están. |
| F4 | Ejecución | Ejecución | Avance físico y financiero hacia control | Solo en parte, en paralelo con F5. Avance, subcontrato en sus partidas, libro y protocolo de partida sí. Permisos, compras, facturación y desempeño no. |
| F5 | Monitoreo y control | Monitoreo y control | Alcance contratado al 100% | Solo en parte. Candado de evidencia, EV, SPI/CPI y no conformidad de partida sí. Variación con el mandante, freeze, riesgos y checklist de cierre de alcance no. |
| F6 | Cierre contractual y administrativo | Cierre | TOP aceptado y dossier interno | No todavía, salvo anotar razones en Conocimiento. |
| F7 | Garantías y traspaso | Post-cierre | Garantías liberadas y archivo | No todavía. |

F2.5 y F4.4 pueden aparecer como hechos en Inicio solo porque el alta de la empresa ya está guardada. El ensayo debe mirar la pantalla del paso, no ese semáforo.

### Pasos

Cada fila se repite en los tres modos. "Ruta" es donde se ensaya. "Plataforma" es el estado al 20-oct-2026.

| ID | Paso | Gate | Ruta | Plataforma |
|---|---|---|---|---|
| F0.1 | Empresa, áreas y puestos | No | `/admin` | Listo. En individual no hay pantallas de áreas ni puestos. |
| F1.1 | Notificación de adjudicación | No | `/clients` | Cliente y obra. Sin oficio PDF. |
| F1.2 | Revisión y aceptación de condiciones contractuales | Sí | `/clients` | Condiciones en el kickoff. Sin loop legal. |
| F1.3 | Firma y formalización del contrato | No | `/clients` | Tipo de contrato y garantías anotados. Sin boletas. |
| F1.4 | Designación del equipo del proyecto | No | `/teams` | Colaborativo: asignación. Individual: la misma persona cubre los puestos. Cliente: N/A. |
| F1.5 | Kick-off comercial a operaciones | No | `/clients` | Alcance, plazos y costo en el extracto. |
| F2.1 | Revisión de antecedentes técnicos | Sí | `/demo` | Razones por escrito. Un archivo es opcional. |
| F2.2 | Acta de constitución | No | `/clients` | Cierre interno del kickoff. Sin PDF de charter. |
| F2.3 | Identificación preliminar de interesados | No | `/clients` | Solo el cliente de la obra. |
| F2.4 | Kick-off de partida con el cliente | No | `/clients` | Día 1. Lo escribe la empresa. Abre el calendario. |
| F2.5 | Estructura organizacional y recursos preliminares | No | `/profiles` | Puestos del tenant. No publica letras RACI. Semáforo de Inicio puede mentir. |
| F3.1 | Alcance EDT | No | `/gantt` | Paquete, actividad, inspección e hito. |
| F3.2 | Cronograma base | No | `/gantt` | Inicio, término y línea base. |
| F3.3 | Presupuesto y línea base de costo | No | `/budget`, `/budget-review`, `/budget-approval` | Colaborativo: tres manos. Individual: una mano. Cliente: no ve el monto. |
| F3.4 | Plan de riesgos | No | `/demo` | Paso del libro. Sin matriz. |
| F3.5 | Plan de adquisiciones y subcontratos | No | `/demo` | Hay puestos Bodega y Subcontrato. Sin plan de compras. |
| F3.6 | Plan de gestión de calidad | No | `/demo` | Documento de plan ausente. No usar `/calidad` para dar este paso por cerrado. |
| F3.7 | Plan de comunicaciones y recursos | No | `/demo` | Inicio muestra el puesto. Sin plan de informes. |
| F3.8 | Plan de gestión del proyecto | No | `/demo` | No hay un PDF único. |
| F3.9 | Aprobación de la línea base | Sí | `/baseline` | La actividad guarda el plan original. Freeze DRAFT a v1.0 pendiente. |
| F4.1 | Movilización | No | `/gantt` | Sin acta de instalación. |
| F4.2 | Permisos | Sí | `/libro-obra` | Interferencias en el libro. Gate municipal pendiente. |
| F4.3 | Compra de materiales | No | `/demo` | Sin órdenes de compra. |
| F4.4 | Contratación de personas | No | `/users` | Personas del tenant. Sin contrato laboral. Semáforo puede mentir. |
| F4.5 | Ejecución según EDT | No | `/progress` | Terreno sube foto; escritorio sube documento. |
| F4.6 | Subcontratos en ejecución | No | `/progress` | El puesto subcontrato ve sus partidas. |
| F4.7 | Anticipos y facturación | No | `/finance` | Pagos es marcador. El AC entra por avance o Gastos. |
| F4.8 | Aseguramiento de calidad | No | `/calidad` | Protocolo de partida ensayable. |
| F4.9 | Desarrollo del equipo | No | `/gantt` | Sin módulo de desempeño. |
| F4.10 | Informe periódico | No | `/demo` | Inicio muestra EV, CPI, SPI y curva S. Cortes periódicos pendientes. |
| F5.1 | Medición y candado de evidencia | Sí | `/evidence` | Sin evidencia validada el EV no suma. |
| F5.2 | Valor ganado y curva S | No | `/demo` | PV, EV y AC en Inicio. |
| F5.3 | SPI y CPI | Sí | `/demo` | Semáforos. El salto automático a F5.4 no está. |
| F5.4 | Acción correctiva | No | `/gantt` | Se edita el desvío y se conserva la línea base. Sin acta. |
| F5.5 | Variaciones de obra | No | `/gantt` | Desvío visible. Sin solicitud formal. |
| F5.6 | Acuerdo económico con el mandante | Sí | `/clients` | Sin anexo. El cliente no aprueba dentro de la vista. |
| F5.7 | Cambio de línea base | Sí | `/baseline` | Freeze y replan pendientes. |
| F5.8 | No conformidades | No | `/calidad` | Registro, responsable, plazo, cierre y freno de EV ensayables. |
| F5.9 | Seguimiento de riesgos | No | `/demo` | Depende de F3.4. Sin módulo. |
| F5.10 | Informe de desempeño | No | `/demo` | El tablero de Inicio es el informe vivo. |
| F5.11 | Cierre de alcance | Sí | `/demo` | Sin checklist de alcance al 100%. |
| F6.1 | Pruebas y puesta en marcha | No | `/progress` | Se puede anotar como inspección. Sin protocolo de commissioning. |
| F6.2 | Recepción provisoria | Sí | `/projects` | El proyecto puede marcarse cerrado. Sin acta. |
| F6.3 | Subsanación | Sí | `/progress` | Loop del libro. Sin punch list. |
| F6.4 | Entrega del TOP | Sí | `/knowledge` | Distinto del dossier interno. Sin paquete TOP. |
| F6.5 | Recepción definitiva | No | `/projects` | Paso del libro. Sin acta. |
| F6.6 | Liquidación | No | `/finance` | Paso del libro. Sin finiquito. |
| F6.7 | Devolución de garantías | No | `/finance` | Paso del libro. Sin canje. |
| F6.8 | Cierre administrativo | No | `/projects` | Existe el estado Cerrado. Sin checklist. |
| F6.9 | Lecciones aprendidas | No | `/knowledge` | Razones de kickoff ya se guardan. Falta el cierre. |
| F6.10 | Dossier interno | No | `/knowledge` | No está. No se mezcla con F6.4. |
| F7.1 | Capacitación a postventa | No | `/knowledge` | Paso del libro. Sin módulo. |
| F7.2 | Traspaso a postventa | No | `/projects` | Paso del libro. Sin acta. |
| F7.3 | Activación de garantía | No | `/clients` | Se puede anotar en el kickoff. Sin plazos de póliza. |
| F7.4 | Solicitudes de garantía | Sí | `/demo` | Sin mesa de tickets. |
| F7.5 | Cierre del período | No | `/projects` | Paso del libro. Sin módulo. |
| F7.6 | Archivo definitivo | No | `/projects` | Fin del libro. Sin archivo histórico. |

### Módulos y tareas del barrido

| Módulo | Ruta | Permiso | Tareas que el barrido debe listar |
|---|---|---|---|
| Inicio | `/demo` | ver cronograma | Ver ciclo F0–F7, EV, CPI, SPI, curva S, tabla de partidas, aviso de partida frenada por calidad. |
| Administración | `/admin` | administrar usuarios | Abrir personas, puestos y empresa. N/A en individual y en cliente. |
| Personas | `/users` | administrar usuarios | Crear colaborador con correo y puesto. N/A en individual y en cliente. |
| Puestos | `/profiles` | administrar usuarios | Ver qué puede hacer un puesto. N/A en individual y en cliente. |
| Áreas | `/areas` | configuración del tenant | Activar un área. N/A en individual y en cliente. |
| En la obra | `/teams` | equipo del proyecto | Asignar una persona a la obra. N/A en individual y en cliente. |
| Conocimiento | `/knowledge` | ver cronograma | Leer comentarios de kickoff. |
| Clientes | `/clients` | administrar proyecto | Crear cliente, crear obra, abrir kickoff, abrir "Vista del cliente" de esa ficha, abrir "Ver como este cliente" de una obra. |
| Obras | `/projects` | administrar proyecto | Abrir la obra estándar. |
| Cronograma | `/gantt` | editar cronograma | Ver partidas, fechas y línea base de la obra estándar. |
| Cortes | `/cuts` | editar cronograma | Abrir un corte. El informe periódico del libro sigue pendiente. |
| Avance | `/progress` | subir evidencia | Registrar porcentaje y archivo de una partida. |
| Libro de obra | `/libro-obra` | subir evidencia | Anotar en el tablero y mover el estado del folio. |
| Evidencias | `/evidence` | aprobar evidencia | Ver una evidencia en revisión y validarla o rechazarla. En individual el alta ya queda validada. |
| Calidad | `/calidad` | subir evidencia | Aplicar protocolo, marcar ítem, abrir y cerrar no conformidad. |
| Presupuesto | `/budget` | proponer presupuesto | Cargar el monto de la obra. |
| Revisar presupuesto | `/budget-review` | revisar presupuesto | Aceptar o proponer otro monto. |
| Aprobar presupuesto | `/budget-approval` | aprobar presupuesto | Cerrar el monto. En individual lo hace la misma persona. |
| Pagos | `/finance` | proponer presupuesto | Abrir la pantalla y registrar que es un marcador. |
| Gastos | `/costs` | editar costo | Anotar un gasto del día. |
| Empresa | `/tenant` | configuración del tenant | Ver datos de la empresa. Firma, SII y ERP son antecedentes, no una conexión hecha. |
| Vista del cliente | `/cliente` | la abre la empresa | Listar solo las obras de esa razón social. Abrir una y leer código, partida, tipo, fechas, avance y calidad. Comprobar que no hay montos. |

### Guion mínimo del proyecto estándar

1. Individual o colaborativo, según el bloque: confirmar el modo en Inicio.
2. Clientes: una razón social y una obra.
3. Kickoff interno y Día 1, con el dato que ese modo pide.
4. Presupuesto, con una mano o con tres, según el modo.
5. Cronograma de esa obra.
6. Avance de una partida y, en colaborativo, validación de la evidencia por otro rol.
7. Calidad sobre esa misma partida: protocolo, no conformidad, freno visible en Inicio, cierre, historial.
8. Libro de obra: un folio de esa obra.
9. Cliente: abrir la vista de esa razón social y comprobar la columna Calidad y la ausencia de montos.

### Qué deja una fila confirmada

La fila pasa a Cubierto solo con resultado de ensayo y una evidencia (ruta y qué se vio, o el dato guardado). Parcial cuando la pantalla existe y el gate del libro no. Brecha cuando el paso está en el flujo y no hay dato que observar. N/A del modo cuando el control no corresponde a esa forma de trabajar. Por ensayar cuando la lógica es validable y todavía no se recorrió.
