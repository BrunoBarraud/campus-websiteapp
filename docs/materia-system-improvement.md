# Materia System Improvement

## Resumen del análisis

Se revisó el sistema de materias del campus virtual desde ambos roles principales:

- profesor
- alumno

También se inspeccionaron los módulos y rutas relacionados con:

- unidades
- contenidos por unidad
- tareas
- entregas
- calificación
- foros
- dashboard de materias

La conclusión general es que el sistema tiene una base funcional sólida, pero fue creciendo por capas con criterios diferentes según pantalla o módulo. Eso genera inconsistencias de UX, duplicación de lógica y algunos contratos de datos poco uniformes.

Problemas estructurales principales detectados:

- El mismo concepto se resuelve distinto según la pantalla o la ruta.
- Parte de la composición de datos ocurre en frontend en vez de venir consolidada desde la API.
- Hay flujos funcionales pero poco directos, especialmente en creación de foros y entregas de tareas.
- Existen componentes demasiado grandes que mezclan UI, fetch, transformación de datos y navegación.

## Áreas revisadas

### Páginas principales

- `app/campus/teacher/subjects/[id]/page.tsx`
- `app/campus/student/subjects/[id]/page.tsx`
- `app/campus/teacher/subjects/[id]/assignments/page.tsx`
- `app/campus/student/subjects/[id]/assignments/page.tsx`
- `app/campus/teacher/subjects/[id]/assignments/[assignmentId]/submissions/page.tsx`
- `app/campus/teacher/subjects/[id]/forums/page.tsx`
- `app/campus/student/subjects/[id]/forums/page.tsx`

### Componentes principales

- `components/teacher/UnitAccordionTeacher.tsx`
- `components/student/UnitAccordionStudent.tsx`
- `components/forums/CreateForumModal.tsx`
- `components/forums/AskQuestionModal.tsx`
- `components/subjects/SubjectHeroCard.tsx`

### APIs principales

- `app/api/units/[unitId]/sections/route.ts`
- `app/api/forums/route.ts`
- `app/api/forums/[id]/questions/route.ts`
- `app/api/forums/questions/[id]/answers/route.ts`
- `app/api/subjects/[id]/assignments/route.ts`
- `app/api/subjects/[id]/assignments/[assignmentId]/submissions/route.ts`
- `app/api/student/subjects/[id]/assignments/route.ts`
- `app/api/student/subjects/[id]/assignments/[assignmentId]/submissions/route.ts`
- `app/api/student/assignments/upcoming/route.ts`

## Problemas detectados

## 1. Lado profesor

### 1.1 Página de materia con demasiadas responsabilidades

La página de detalle de materia del profesor mezcla:

- hero de la materia
- resumen general
- accesos secundarios
- acciones de gestión
- edición de unidades

Problemas:

- No hay una separación clara entre vista operativa y vista de administración.
- Algunas acciones son inline, otras usan modal y otras redirigen a otra pantalla.
- El profesor no tiene una experiencia completamente coherente sobre dónde se crea, edita y controla cada tipo de contenido.

Impacto:

- Mayor carga cognitiva.
- Menor previsibilidad.
- Más dificultad para escalar la experiencia cuando se agregan más funciones.

### 1.2 `UnitAccordionTeacher` concentra demasiada lógica

El componente `components/teacher/UnitAccordionTeacher.tsx` hoy es uno de los puntos más sensibles del módulo.

Responsabilidades detectadas:

- cargar unidades
- cargar secciones
- cargar foros
- fusionar resultados
- mostrar UI
- crear unidades
- editar unidades
- eliminar unidades
- crear contenidos
- borrar contenidos
- manejar tareas
- manejar foros
- decidir navegación

Problemas:

- Componente demasiado grande.
- Mucho branching por `content_type`.
- Mezcla lógica visual, lógica de dominio y fetch.
- Alta probabilidad de regresión al tocarlo.

Impacto técnico:

- Baja mantenibilidad.
- Difícil de testear.
- Difícil de refactorizar en partes sin estrategia previa.

### 1.3 Flujo de creación de foros engorroso

Problema confirmado:

- al crear una sección tipo `forum` desde “añadir sección”
- no se crea inline
- se redirige a otra página con query params

Esto ocurre en `components/teacher/UnitAccordionTeacher.tsx`.

Problemas:

- rompe contexto
- agrega pasos innecesarios
- vuelve inconsistente el flujo de creación de contenidos

Impacto UX:

- es el punto más débil del flujo docente dentro de una materia
- se siente como un flujo parcheado y no integrado

### 1.4 Inconsistencia entre tipos de contenido

Hoy los tipos:

- document
- video
- link
- assignment
- forum

aparecen juntos en UI, pero no siguen el mismo ciclo real de creación.

Problemas:

- `assignment` crea contenido y además una entrada en `assignments`
- `forum` no sigue el mismo flujo que el resto
- visualmente parecen equivalentes, pero funcionalmente no lo son

Impacto:

- modelo mental poco claro para el docente
- mayor complejidad interna para sostener la experiencia

## 2. Sistema de tareas y calificación

### 2.1 Las tareas tienen dos caminos de creación

Las tareas pueden surgir:

- desde una unidad como sección
- desde la página dedicada de tareas

Problemas:

- no está completamente unificado el concepto de “tarea”
- el sistema puede terminar teniendo reglas distintas según el punto de entrada
- no está del todo claro si la unidad es la fuente de verdad o si la pantalla de tareas lo es

Impacto:

- posible divergencia funcional a futuro
- mantenimiento más costoso

### 2.2 Contratos inconsistentes en entregas

Se detectó una inconsistencia concreta entre rutas de entregas:

- una parte del sistema usa `submission_text`
- otra usa `content`

Además:

- una ruta permite actualizar una entrega existente
- otra está pensada más como inserción directa
- una valida vencimiento en forma estricta
- otra tiene un comportamiento diferente

Impacto:

- riesgo de bugs
- inconsistencia entre pantallas
- más difícil escalar reentregas, borradores o correcciones más sofisticadas

### 2.3 Estados de tarea no completamente unificados

Hoy conviven:

- estados persistidos
- estados derivados en frontend
- lógica visual basada en presencia de `submission`, `score`, `due_date`, etc.

Problemas:

- no hay un modelo canónico claro de estado
- la UI y la persistencia no hablan siempre el mismo idioma

Ejemplos de estado que hoy aparecen o se infieren:

- pendiente
- entregada
- vencida
- calificada
- submitted

Impacto:

- más difícil filtrar
- más difícil resumir en dashboard
- más difícil escalar lógica de workflow

### 2.4 Corrección docente correcta pero lineal

La pantalla de corrección docente funciona, pero todavía está bastante cerca de un MVP:

- lista de entregas
- búsqueda básica
- modal de calificación

Problemas:

- poco soporte para revisión intensiva
- filtros limitados
- navegación entre entregas mejorable
- falta una estrategia más clara para grandes volúmenes

## 3. Lado alumno

### 3.1 Página de materia demasiado dependiente del acordeón

La página del alumno se apoya fuertemente en:

- hero
- progreso
- próximo vencimiento
- acordeón de unidades

Problemas:

- el resumen se basa casi exclusivamente en tareas
- no integra fuerte novedades, materiales recientes o actividad del foro
- depende demasiado de cómo se ensamblan los contenidos en el acordeón

### 3.2 `UnitAccordionStudent` también recompone datos en frontend

El componente del alumno:

- carga unidades
- carga contenidos por unidad
- carga foros por unidad
- fusiona resultados en cliente

Problemas:

- duplicación de lógica respecto al flujo del profesor
- riesgo de diferencias entre una vista y otra
- reglas de visibilidad y filtrado repartidas entre backend y frontend

Impacto:

- menor consistencia
- mayor complejidad para mantener la experiencia sincronizada entre roles

### 3.3 Sistema de tareas del alumno útil, pero mejorable

La vista actual de tareas del alumno es funcional y razonablemente clara, pero tiene puntos a mejorar:

- mezcla consulta, entrega y revisión en un mismo flujo
- no deja totalmente claro si una tarea puede reentregarse
- el historial de tareas vencidas o no accionables puede quedar demasiado oculto
- faltan vistas separadas más claras por estado

### 3.4 Descarga de archivos y consumo de materiales

Hay soporte para archivos y materiales, pero todavía falta claridad de experiencia sobre:

- qué material es principal
- qué material es complementario
- qué fue descargado o revisado
- qué tipo de contenido está abriendo el alumno

No es un error funcional crítico, pero sí una oportunidad clara de mejora de UX.

## 4. Sistema de foros

### 4.1 Foros bien planteados a nivel dominio, pero separados del flujo de materia

El sistema de foros tiene buena base:

- permisos por rol
- respuestas entre estudiantes opcionales
- aprobación opcional de preguntas

Problemas:

- el foro existe como módulo separado
- pero también aparece incrustado dentro de las unidades
- esa doble naturaleza no está resuelta del todo en UX

Impacto:

- el usuario no siempre lo percibe como parte orgánica de la materia
- a veces se siente más como un subsistema externo

### 4.2 Diferencia poco clara entre foro general y foro de unidad

Aunque técnicamente existe `unit_id`, la experiencia no diferencia con suficiente fuerza:

- foro general de materia
- foro asociado a unidad

Eso afecta:

- jerarquía
- navegación
- comprensión del contexto

### 4.3 Modales funcionales pero algo aislados

`CreateForumModal` y `AskQuestionModal` resuelven bien lo básico, pero:

- tienen validaciones mínimas
- no tienen demasiada ayuda contextual
- no parecen todavía parte de un flujo más integral del módulo de materias

## 5. Problemas transversales de código

### 5.1 Duplicación de lógica

Se repiten patrones en:

- carga de unidades
- carga de contenidos
- carga de foros
- transformación de datos
- criterios de visualización

### 5.2 Componentes demasiado grandes

Principalmente:

- `components/teacher/UnitAccordionTeacher.tsx`

También:

- vistas de tareas
- vistas de foros
- pantallas de corrección

### 5.3 Contratos API no unificados

Principalmente en:

- entregas de tareas
- payloads de submission
- estructuras de assignment según rol

### 5.4 Navegación inconsistente

Conviven:

- `router.push`
- `window.location.href`
- `href`
- botones que disparan redirección

Impacto:

- menos previsibilidad
- navegación menos limpia
- peor mantenibilidad

### 5.5 Lógica de dominio demasiado cerca de la UI

Ejemplos:

- cómo fusionar foros con contenidos
- qué tareas mostrar
- cuándo una tarea se considera pendiente o vencida
- cómo calcular progreso

## Mejoras propuestas

## Fase 1. Unificar datos y contratos

### Propuesta 1. Unificar el modelo de contenidos por unidad

Objetivo:

- que la API entregue una unidad ya resuelta con todos sus ítems en orden
- evitar que frontend tenga que fusionar contenidos y foros

Beneficios:

- más consistencia entre profesor y alumno
- menos lógica duplicada
- menos riesgo de discrepancias visuales o funcionales

### Propuesta 2. Unificar el contrato de entregas

Objetivo:

- elegir un único payload canónico
- usar un solo campo de texto
- definir claramente si se permite crear, actualizar o reentregar

Beneficios:

- menos bugs
- menor deuda técnica
- base más clara para mejoras futuras

### Propuesta 3. Definir un modelo canónico de estados de tarea

Ejemplo de modelo visual sugerido:

- pendiente
- entregada
- vencida
- corregida
- devuelta

Beneficios:

- mejor claridad funcional
- mejor experiencia para alumno y profesor
- más fácil construir filtros, resúmenes y dashboard

## Fase 2. Simplificar flujos de profesor

### Propuesta 4. Crear foros inline o en modal dentro de la unidad

Objetivo:

- eliminar la redirección forzada al crear foro desde “añadir sección”
- mantener al profesor dentro del contexto de la unidad

Opciones recomendadas:

- modal integrado
- subformulario expandible
- wizard corto dentro del mismo panel

### Propuesta 5. Clarificar el concepto de tarea

Objetivo:

- definir si la tarea es un tipo de contenido o una entidad académica con representación dentro de la unidad
- ordenar la UX en base a esa decisión

Sugerencia:

- mantener la tarea como entidad propia
- pero representarla dentro de la unidad con el mismo lenguaje visual que el resto

### Propuesta 6. Separar mejor edición de contenido y resumen de materia

Objetivo:

- dejar la página de materia del profesor más enfocada
- reducir mezcla de métricas, acciones y edición intensiva en un solo bloque

## Fase 3. Mejorar experiencia del alumno

### Propuesta 7. Reorganizar la vista de tareas del alumno

Sugerencia:

- pestañas o segmentos por estado
- separar mejor:
  - pendientes
  - entregadas
  - calificadas

Beneficio:

- más claridad
- menos fricción
- mejor trazabilidad

### Propuesta 8. Mejorar la página de materia del alumno

Objetivo:

- hacerla más útil y menos dependiente solo del acordeón

Elementos recomendados:

- próximos vencimientos
- últimas publicaciones
- accesos rápidos a tareas y foros
- resumen corto y accionable

### Propuesta 9. Mejorar consumo de materiales

Objetivo:

- hacer más claro qué tipo de contenido está viendo o descargando el alumno
- reforzar jerarquía visual y contexto

## Fase 4. Mejorar foros

### Propuesta 10. Diferenciar mejor foro general y foro por unidad

Objetivo:

- reforzar el contexto del foro
- mejorar navegación y comprensión

### Propuesta 11. Hacer el foro más orgánico dentro de la materia

Objetivo:

- que el usuario sienta el foro como parte natural del recorrido de aprendizaje
- no como un módulo aparte al que “salta”

## Fase 5. Dashboard de tareas pendientes

### Propuesta 12. Agregar bloque útil de tareas pendientes

El sistema ya tiene una base en:

- `app/api/student/assignments/upcoming/route.ts`

Pero hoy devuelve:

- cantidad
- la más próxima

Para el dashboard se recomienda devolver una lista real y útil.

Contenido sugerido del bloque:

- nombre de la tarea
- materia
- fecha de entrega
- estado
- acción para abrir

Sugerencia UX:

- no mostrar una lista infinita
- mostrar entre 5 y 8 ítems relevantes
- permitir ir a ver todas

Beneficio:

- valor real inmediato
- mejor foco del alumno
- funcionalidad útil y no decorativa

## Cambios sugeridos por archivo

### Componentes y páginas

- `components/teacher/UnitAccordionTeacher.tsx`
  - dividir responsabilidades
  - extraer lógica de contenidos
  - mejorar creación inline de foros

- `components/student/UnitAccordionStudent.tsx`
  - reducir lógica de composición local
  - alinear criterio con backend consolidado

- `app/campus/teacher/subjects/[id]/page.tsx`
  - reordenar experiencia docente

- `app/campus/student/subjects/[id]/page.tsx`
  - reforzar resumen y jerarquía de información

- `app/campus/teacher/subjects/[id]/assignments/page.tsx`
  - clarificar modelo de tareas

- `app/campus/student/subjects/[id]/assignments/page.tsx`
  - mejorar organización por estado

- `app/campus/teacher/subjects/[id]/assignments/[assignmentId]/submissions/page.tsx`
  - mejorar revisión y corrección docente

- `app/campus/teacher/subjects/[id]/forums/page.tsx`
  - integrar mejor la creación y contextualización

- `app/campus/student/subjects/[id]/forums/page.tsx`
  - reforzar contexto y claridad de uso

- `components/forums/CreateForumModal.tsx`
  - adaptar a flujo inline/modal integrado dentro de materia

- `components/forums/AskQuestionModal.tsx`
  - reforzar ayudas y consistencia con el sistema

### APIs

- `app/api/units/[unitId]/sections/route.ts`
  - revisar si debe seguir siendo fuente compuesta para assignments

- `app/api/forums/route.ts`
  - integrarlo mejor al flujo de unidad

- `app/api/subjects/[id]/assignments/route.ts`
  - revisar consistencia del modelo de tarea

- `app/api/subjects/[id]/assignments/[assignmentId]/submissions/route.ts`
  - unificar contrato de submissions

- `app/api/student/subjects/[id]/assignments/[assignmentId]/submissions/route.ts`
  - alinear naming, validaciones y comportamiento

- `app/api/student/assignments/upcoming/route.ts`
  - extender respuesta para dashboard útil

## Riesgos detectados

- Riesgo de romper vistas si se toca `UnitAccordionTeacher` sin separar primero responsabilidades.
- Riesgo de inconsistencias si se modifica solo frontend sin unificar antes contratos API.
- Riesgo de duplicar lógica aún más si se agregan mejoras puntuales sin estrategia de consolidación.
- Riesgo de regresión en entregas si no se decide primero una ruta canónica para submissions.
- Riesgo de seguir mezclando foro como módulo externo y foro como contenido de unidad si no se redefine ese modelo de experiencia.

## Refactors futuros recomendados

- Extraer hooks o servicios compartidos para:
  - carga de unidades
  - carga de contenidos de materia
  - carga de tareas
  - mapeo de estados de tarea

- Reducir tamaño de componentes grandes.
- Mover transformación de datos a capa de servicio o API.
- Unificar navegación en torno a `router.push` o una convención coherente.
- Crear tipos compartidos para:
  - content item
  - assignment summary
  - submission state
  - forum summary

## Prioridades recomendadas

### Alta prioridad

- simplificar creación de foros
- unificar entregas
- unificar contenidos por unidad
- definir estados de tarea

### Media prioridad

- reorganizar vista de tareas de alumno
- mejorar corrección docente
- mejorar página de materia de alumno y profesor

### Baja prioridad

- mejoras cosméticas adicionales
- refinamientos de copy
- mejoras de consumo de materiales no críticas

## Mejoras aplicadas

Primera fase aplicada:

- Se integró la creación de foros dentro del flujo de unidades del profesor para evitar la redirección obligatoria a otra pantalla.
- El formulario de nueva sección ahora permite configurar el foro inline:
  - permitir respuestas entre estudiantes
  - requerir aprobación de preguntas
- Se unificó el contrato principal de entregas de tareas para aceptar tanto `submission_text` como `content`, manteniendo compatibilidad con el frontend existente.
- La ruta principal de submissions ahora normaliza la respuesta para exponer `content` en forma consistente sin perder `submission_text` como dato fuente.
- La ruta de submissions del alumno ahora acepta JSON y `multipart/form-data`, valida mejor el payload y actualiza entregas existentes en lugar de duplicarlas.
- Se extendió la API de tareas próximas del alumno para devolver una lista real de pendientes, no solo conteo y la más cercana.
- Se agregó un bloque útil de tareas pendientes en el dashboard principal del alumno con:
  - nombre
  - materia
  - fecha de entrega
  - acceso directo

Segunda fase aplicada:

- La vista de tareas del alumno se reorganizó por estados útiles:
  - pendientes
  - entregadas
  - calificadas
  - vencidas
  - todas
- La pantalla ya no oculta automáticamente tareas activas vencidas sin entrega, lo que mejora trazabilidad y claridad.
- La corrección docente incorporó filtros rápidos por estado:
  - pendientes
  - calificadas
  - entregadas tarde
  - todas
- Esto mejora la ergonomía operativa sin cambiar contratos ni estructura funcional del módulo.

Tercera fase aplicada:

- Se creó una normalización compartida de contenidos y foros por unidad en:
  - `app/lib/subjects/unitSections.ts`
- Las APIs de unidades del alumno ahora devuelven una estructura más consolidada, evitando que frontend tenga que recomponer contenidos y foros manualmente.
- La API principal de secciones por unidad para profesor también quedó alineada con esa normalización.
- El acordeón del alumno dejó de hacer múltiples fetches por unidad para luego fusionar resultados en cliente.
- El acordeón del profesor mantiene su flujo actual, pero ahora deduplica correctamente secciones para evitar duplicaciones de foros mientras termina la transición.

Cuarta fase aplicada:

- Se reemplazó navegación imperativa sensible del acordeón docente por navegación controlada con router para:
  - ver foro
  - ver entregas
- Se mantuvo el flujo visual actual, pero con menos acoplamiento interno.
- Se validó la integración completa con TypeScript sin errores luego de esta pasada incremental.

Quinta fase aplicada:

- La página de materia del profesor ahora tiene accesos operativos directos para:
  - gestionar tareas
  - entrar a foros
  - ver alumnos
- La página de materia del alumno ahora tiene accesos rápidos para:
  - tareas
  - foros
  - calendario
- Esto reduce la dependencia del acordeón como único punto de navegación y mejora el modelo mental del módulo antes de una pasada visual más profunda.

Sexta fase aplicada:

- Se rediseñó visualmente `SubjectHeroCard` para que la cabecera de materia se vea más sólida, limpia y profesional.
- Se mejoró la jerarquía visual de las páginas de materia de alumno y profesor con:
  - paneles de accesos rápidos
  - mejores títulos de sección
  - separación más clara entre resumen y contenido
- Se compactaron y modernizaron visualmente los acordeones de unidades de alumno y profesor:
  - mejor encabezado de unidad
  - badges de contexto
  - cards de contenido más consistentes
  - mejor densidad visual y legibilidad

Estas mejoras fueron visuales y de organización de interfaz, sin modificar contratos funcionales ni rutas.

Pendiente para siguientes fases:

- refactor grande de `UnitAccordionTeacher`
- mejoras de UX adicionales en páginas de materia y corrección docente

## Próximo paso sugerido

Implementar en este orden:

1. unificación de contratos de tareas y entregas
2. simplificación del flujo de creación de foros
3. consolidación de contenidos de unidad
4. mejora UX de tareas alumno/profesor
5. bloque de tareas pendientes en dashboard
