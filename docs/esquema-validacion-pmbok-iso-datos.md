# Esquema de validación — PMBOK, ISO 9001 y datos personales

Documento de trabajo para contrastar el flujo Rev3 con la plataforma. No reemplaza el libro [`2026-09-13_Flujo_Proceso_Proyecto_Adjudicacion_a_Garantias_Rev3.xlsx`](./2026-09-13_Flujo_Proceso_Proyecto_Adjudicacion_a_Garantias_Rev3.xlsx). La matriz para ir confirmando cada etapa está en [`2026-10-20_Esquema_Validacion_PMBOK_ISO9001_Datos.xlsx`](./2026-10-20_Esquema_Validacion_PMBOK_ISO9001_Datos.xlsx).

Las normas se citan por número de cláusula o artículo. Este archivo no reproduce su texto.

| Fuente | Uso en la validación |
|---|---|
| Libro Rev3 | IDs F0–F7 y gates. Sigue siendo el ciclo del proyecto. |
| ISO 9001:2015, traducción oficial en `ZBTIS/ISOS/NOM_ISO_9001-2015.pdf` | Control del proceso: roles, información documentada, riesgos, liberación, no conformidad y mejora. En Chile la adopción nacional es NCh-ISO 9001:2015; la estructura de cláusulas es la misma. |
| Guía Práctica de Ágil (PMI y Agile Alliance, 2017), `ZBTIS/ISOS/AgilePG_SPA.pdf` | Solo donde una práctica diaria agrega valor. El ciclo contractual sigue siendo predictivo. |
| Ley 19.628, vigente | Protección de la vida privada hasta el día anterior a la vigencia de la Ley 21.719. |
| Ley 21.719 | Protección de datos personales. Publicada el 13-dic-2024. Vigencia diferida desde el **1-dic-2026** (Ley Chile, versión con vigencia diferida). El boletín 18.623-07 propone postergarla; mientras no sea ley, la fecha que manda es el 1-dic-2026. |
| Constitución, art. 19 N° 4 | Derecho a la vida privada y a la protección de datos personales. |

## Cómo se valida una etapa

Una fase del Rev3 queda confirmada solo si las tres capas cierran. Marcar el paso en Inicio no alcanza.

1. Elegir la fase (F0–F7) y el modo (colaborativo o independiente).
2. En la hoja `Matriz_fases` del Excel, responder la pregunta de validación con evidencia de pantalla o de dato guardado.
3. Si la fase pide o muestra datos de una persona natural, completar o revisar la fila en `Inventario_datos`. El tenant y el RBAC no cierran esa fila solos.
4. Si la fase tiene trabajo de faena día a día, contrastar `Diario_agil` (libro de obra). No se abre un sprint en lugar del gate contractual.
5. Anotar el veredicto: **Cubierto**, **Parcial**, **Brecha**, **N/A del modo** o **Por ensayar**.
6. Copiar solo lo confirmado a `Bitacora`, con fecha, modo y prueba. Lo demás sigue en Propuesto.

## Tres capas sobre el mismo ID

**ISO 9001** pregunta si el proceso está definido, si alguien tiene autoridad para decidir, si la evidencia se controla y si una salida no conforme vuelve a entrar al flujo. Encaja con los gates del Rev3 (línea base, candado de valor ganado, recepción, acción correctiva).

**Ágil** entra como ciclo híbrido: el contrato, la línea base y el cierre siguen el orden F1–F3 y F6 (enfoque predictivo con componentes ágiles, Guía §§ 3.1.6 a 3.1.8). El día a día de faena usa un tablero visible (Guía § 2.3, lean y kanban). Ese tablero ya existe: Libro de obra, columnas abierto / en faena / cerrado. No sustituye F3.9 ni F6.2.

**Datos personales** pregunta por el titular, no por el rol. Una persona natural es titular aunque no tenga usuario en el tenant. El RUT de una sociedad no es dato personal. El RUT, el nombre o el correo de una persona natural sí lo son. La foto y la geolocalización también, y el texto libre del libro puede llegar a ser dato sensible (salud, accidente) si se escribe ahí.

El profesional independiente no queda fuera. La Ley 21.719 distingue estándares según tamaño (art. 14 septies, en relación con la Ley 20.416), y aun así exige licitud, finalidad y seguridad. En modo individual el profesional es, a la vez, el único usuario y quien tipea datos de otras personas.

## El hueco que el ejemplo de la fase 3 muestra

La planificación (grupo PMBOK de planificación, F3) pide roles y segregación. ISO 9001 cláusula 5.3 pide que responsabilidades y autoridades estén asignadas y se comuniquen. En colaborativo eso está dibujado: Finanzas carga el presupuesto, el gestor revisa y el administrador o comercial aprueba (`startup-flow.ts`). El RBAC de diseño (`docs/rbac-matrix.md`) impide que Terreno congele la línea base. El aislamiento por `tenant_id` impide que otra empresa lea ese presupuesto.

Eso cubre **quién dentro de la organización** toca el proceso. No cubre **qué puede entregar o negar la persona**:

| Pregunta de la Ley 21.719 | Qué responde hoy el tenant / RBAC | Qué falta |
|---|---|---|
| ¿El tratamiento es lícito y se puede acreditar? (art. 3 a, art. 12 y 13) | Hay cuenta y hay contrato de obra. No hay registro de la base usada para cada campo. | Ficha por campo: contrato, obligación legal, interés legítimo o consentimiento. |
| ¿La finalidad se informó al recolectar? (art. 3 b, art. 14 ter) | La pantalla dice para qué sirve el dato de negocio («sin cliente no hay carpeta»). No informa al titular. | Texto corto de finalidad antes de guardar nombre, correo, RUT de persona o ubicación. |
| ¿Se pidió solo lo necesario? (proporcionalidad, art. 3) | Razón social y RUT del cliente son obligatorios. Contacto y correo del cliente están marcados opcionales. Nombre y correo del usuario son obligatorios para existir. En colaborativo, el contacto de cada área exige nombre y correo. | Decir en la misma pantalla qué pasa si el campo opcional se deja vacío, y no exigir correo de un tercero que no va a entrar a la plataforma. |
| ¿El titular puede acceder, rectificar o suprimir? (art. 4 a 11) | El administrador edita fichas. No hay un canal del titular. | Medio de solicitud, aunque sea un correo publicado del responsable (art. 11). |
| ¿Un tercero no usuario quedó registrado? | El libro guarda nombre de ITO, representante y terceros. El avance puede guardar GPS y foto. Esas personas no tienen rol. | El RBAC no las protege. Hace falta finalidad, minimización y retención. |
| ¿Hay dato sensible? (art. 16) | El libro tiene anotaciones de seguridad. El cuerpo es texto libre. | Si se anota salud o un accidente identificable, hace falta base específica, no solo el rol que puede ver el libro. |

Veredicto de la fase 3, a la fecha de este esquema:

- Segregación de roles en colaborativo: **Parcial**. El arranque separa carga, revisión y aprobación. Falta ensayar que un rol sin permiso no apruebe el BAC en la pantalla real.
- Segregación en independiente: **N/A del modo**. La misma persona carga, revisa y aprueba. El control sustituto es dejar el monto y la fecha en el proyecto, no simular un segundo usuario.
- Datos personales de quienes no son usuario (contacto del mandante, asistentes al Día 1, nombres en el libro): **Brecha**. El tenant no informa finalidad ni ofrece un camino de derechos.
- Datos del propio usuario (nombre y correo de la cuenta): **Parcial**. Son necesarios para el acceso, y no hay aviso ni forma de ejercer acceso o supresión sin borrar el tenant a mano.

## Inventario mínimo de datos

Cada fila siguiente es una validación repetible. El detalle y el veredicto viven en la hoja `Inventario_datos`.

| Campo | ¿Dato personal? | Obligatorio hoy | Titular con usuario |
|---|---|---|---|
| RUT y razón social del tenant | Solo si el titular es persona natural (típico del modo independiente) | Sí, en el alta | Sí, el representante |
| Nombre y correo del usuario o invitado | Sí | Sí para crear la cuenta o invitar | Sí |
| Nombre y correo del contacto de área | Sí | Sí en el alta colaborativa de áreas | A veces todavía no tiene cuenta |
| RUT y razón social del cliente | No, si es persona jurídica | Sí | No |
| Nombre y correo del contacto del cliente | Sí | No (la etiqueta dice opcional) | No |
| Asistentes y acuerdos del kickoff con el cliente | Sí, si identifican personas | No | No |
| Nombre de ITO, representante y tercero en el libro | Sí | No | No |
| Autor, nota y foto del avance | Sí si la foto muestra personas; la nota puede serlo | Foto obligatoria en terreno colaborativo; opcional en independiente | El autor sí; quienes salen en la foto, no |
| GPS del avance | Sí (ubicación de quien reporta) | No está forzado en todos los caminos | El autor |
| Texto de seguridad en el libro | Puede ser sensible | No | A menudo no |
| Titular del certificado de firma | Sí | No (antecedente opcional) | Puede ser el representante |

La clave tributaria del SII no se guarda. Ese criterio se mantiene: un antecedente de «tiene acceso» no es una credencial.

## Qué mirar en cada fase

| Fase | ISO 9001 (cláusula y control) | Ágil, solo si agrega valor | Dato o norma que hay que poder demostrar |
|---|---|---|---|
| F0 Alta | 4.3 alcance del sistema; 5.3 roles; 7.5 información documentada del alta | El modo individual es un equipo de una persona (Guía § 4.3). No se inventan áreas para parecer colaborativo. | Aviso de finalidad de nombre, correo y RUT. Invitación colaborativa con correo de un tercero. |
| F1 Adjudicación | 8.2 requisitos del producto y revisión antes de comprometerse | El kickoff interno independiente reúne en un acto lo vendido y el criterio PMBOK. Sigue siendo un gate, no un backlog. | RUT de sociedad frente a datos del contacto humano. |
| F2 Inicio | 5.1.2 enfoque al cliente; 7.4 y 8.2.1 comunicación con el cliente | Comentarios de áreas en colaborativo afinan el alcance. No reemplazan el acta. | Asistentes del Día 1 son titulares sin cuenta. |
| F3 Planificación | 6.1 riesgos; 6.2 objetivos; 8.1 planificación operacional; 5.3 autoridades | La línea base no se parte en iteraciones. El tablero de faena abre después. | Ejemplo desarrollado arriba: segregación distinta de protección de datos. |
| F4 Ejecución | 8.5 provisión del servicio; 8.4 proveedores externos; 7.2 competencia | Libro de obra como tablero diario. Cada folio es un incremento de información, no un entregable contractual. | GPS, foto, texto libre, nombres de terceros. Ley 20.123 y certificados F30 cuando hay subcontrato (diseño RBAC; módulo aún no cerrado). |
| F5 Control | 9.1 seguimiento y medición; 8.6 liberación; 8.7 y 10.2 no conformidad y acción correctiva; 8.5.6 control de cambios | El semáforo SPI/CPI es un radiador. En independiente el registro libera el EV; en colaborativo lo libera la validación de otro rol. | Quién ve evidencia y ubicación. Rechazo de evidencia no borra el historial (la arquitectura ya pide evidencias append-only). |
| F6 Cierre | 8.6 liberación al cliente; 7.5 control de la información que se entrega | Lecciones (F6.9) pueden ser una retrospectiva breve. No adelantan la recepción. | Actas con nombres. Firma electrónica avanzada, Ley 19.799, sigue como antecedente: la conexión no está hecha. El PDF del libro no reemplaza el libro de obras del MOP. |
| F7 Garantías | 8.5.5 actividades posteriores a la entrega | Mesa de tickets como flujo visual mientras el plazo está abierto. | Datos del reclamante y del técnico. Retención hasta el fin de la garantía y el deber de secreto que sigue después (art. 14 bis). |

## Libro diario

El valor ágil que ya está en la plataforma es el Libro de obra, no una capa nueva de ceremonias.

Validar en cualquier obra de prueba:

- Cada anotación tiene folio, fecha, autor y estado de tablero.
- En colaborativo el tablero no reemplaza la validación de evidencias.
- En independiente, cerrar un parte ligado al avance hace contar el EV, porque no hay ITO ni gestor dentro de la plataforma.
- El cuerpo de la nota no pide datos de salud. Si el usuario los escribe, la fila de dato sensible queda en Brecha hasta tener una regla (no registrar diagnóstico; registrar solo el hecho de faena).
- Borrar no es el camino de supresión legal: la evidencia de obra se conserva por el contrato. La supresión de un dato personal que sobra (un correo opcional, un nombre de más) es otro acto, y hoy no existe.

## Qué dejaría confirmada una fase

Hace falta una pasada en los dos modos, con una obra de prueba, y una fila en `Bitacora` que apunte a la pantalla. Para la fase 3, el mínimo es:

- Colaborativo: tres manos distintas en el presupuesto, o la vacante cubierta por una regla explícita; un usuario sin permiso de aprobación no cierra el BAC.
- Independiente: una sola mano, con el monto guardado y la segregación marcada N/A.
- En ambos: ficha del contacto del cliente (opcional, finalidad escrita, se puede omitir) y ficha del usuario (obligatorio para entrar, finalidad de cuenta, canal de derechos aunque sea manual).

Hasta ese ensayo, la fase 3 permanece en **Parcial** por roles y en **Brecha** por datos de terceros.
