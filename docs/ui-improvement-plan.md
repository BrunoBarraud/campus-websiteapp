# UI Improvement Plan

## Resumen general del análisis

Se revisó el frontend del campus con foco en:

- shell global del campus
- dashboard principal y cards de materias
- vistas de materias de alumno y docente
- componentes UI base reutilizables
- estilos globales
- modal administrativo representativo

Problemas visuales detectados:

- La sidebar estaba técnicamente mejor que antes, pero el conjunto seguía viéndose largo y pesado cuando el dashboard crecía.
- El dashboard principal tenía exceso de altura acumulada en header, métricas, cards, panel lateral y bloques secundarios.
- Las `CourseCard` consumían demasiada altura para escenarios con muchas materias.
- En notebooks `1366x768` la interfaz se percibía sobredimensionada: paddings altos, métricas muy grandes, paneles con demasiado aire y demasiada distancia entre bloques.
- Había inconsistencias de densidad entre páginas: algunas estaban bastante compactas y otras seguían con layouts amplios o con estilos locales.
- Persisten zonas con mezcla de Tailwind y estilos inline, especialmente en algunos flujos administrativos.

## Patrones inconsistentes encontrados

- Inputs, selects, textareas, botones y cards no compartían exactamente la misma escala visual.
- Algunas tablas y paginaciones tenían separación correcta en desktop grande pero demasiado aire para altura reducida.
- Había headers y contenedores sin una regla visual global de compactación.
- El dashboard principal usaba componentes relativamente modernos, mientras otras vistas de materias seguían con una densidad distinta.

## Problemas específicos en notebooks 1366x768

- Exceso de scroll vertical para llegar a cursos, agenda y bloques secundarios.
- Cards de materias demasiado altas para listas medianas o largas.
- Sidebar estable, pero visualmente desproporcionada frente a un contenido principal muy extenso.
- Header y métricas ocupando más alto del necesario.

## Plan de implementación

### Fase 1: Base global del shell

- Compactar variables globales de spacing y superficies.
- Mantener sidebar sticky con scroll propio y main desacoplado.
- Introducir utilidades de layout orientadas a dashboards compactos.

### Fase 2: Componentes base reutilizables

- Reducir altura visual de botones, inputs, selects, textareas, cards y paginación.
- Unificar radios, sombras y focus states.
- Mejorar la consistencia de paneles y tablas.

### Fase 3: Dashboard principal

- Reducir altura de header, métricas, cards y panel lateral.
- Reequilibrar la grilla principal para que el dashboard se sienta menos largo.
- Compactar especialmente el bloque de cursos.

### Fase 4: Vistas de materias

- Llevar la misma densidad visual a alumno y docente.
- Reducir altura de cards, banners y filtros.
- Mejorar lectura rápida y aprovechamiento del alto de pantalla.

### Fase 5: Documentación y validación

- Registrar hallazgos, riesgos, deuda técnica visual y recomendaciones futuras.
- Verificar que TypeScript siga compilando.

## Archivos modificados

- `app/globals.css`
- `components/dashboard/DashboardLayout.tsx`
- `app/campus/dashboard/page.tsx`
- `components/dashboard/CourseCard.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/select.tsx`
- `components/ui/card.tsx`
- `components/ui/Pagination.tsx`
- `app/campus/student/subjects/page.tsx`
- `app/campus/teacher/subjects/page.tsx`
- `components/common/SimpleModal.tsx`

## Cambios aplicados

### 1. Shell global y comportamiento general

- Se reforzó la base del layout del campus con menor ancho útil de sidebar en desktop y paddings más compactos en el contenido principal.
- Se introdujeron utilidades globales para:
  - `dashboard-page`
  - `dashboard-stack`
  - `dashboard-grid`
  - `dashboard-card-grid`
  - `dashboard-header`
  - `dashboard-stat`
  - `dashboard-metric-icon`
  - `dashboard-note`
- Se agregó una optimización específica vía `@media (max-height: 820px)` para reducir gap, padding y tamaño percibido en pantallas bajas.

### 2. Compactación del dashboard principal

- El header del dashboard quedó más corto y más limpio.
- Las métricas se rediseñaron para ocupar menos altura y mantener jerarquía visual.
- La zona de cursos pasó a una grilla más densa.
- El panel lateral se volvió más compacto en agenda, accesos rápidos, entregas y racha.
- Se redujo la sensación de “dashboard interminable” sin cambiar endpoints ni lógica.

### 3. Rediseño de `CourseCard`

- Se redujo la altura del hero visual.
- Se comprimieron badges, metadata y CTA.
- La card conserva identidad visual, pero ahora escala mucho mejor cuando hay muchas materias.
- Se priorizó densidad vertical y lectura rápida.

### 4. Vistas de materias de alumno y docente

- Se rehicieron visualmente para alinearlas con el nuevo sistema del dashboard.
- Se compactaron filtros, banners, spacing, grillas y cards.
- Se mejoró el comportamiento general para resoluciones tipo notebook.

### 5. UI base reutilizable

- `button`, `input`, `textarea`, `select`, `card` y `Pagination` quedaron con menor altura visual y mejor consistencia.
- Se ajustaron paddings internos, tamaño de títulos y sombras.
- Esto mejora indirectamente varias pantallas que ya consumen estos componentes.

### 6. Modal reusable

- `SimpleModal` dejó de depender de estilos inline rígidos.
- Ahora tiene overlay, contenedor, header y cierre visualmente más consistentes con el resto del sistema.

## Observaciones técnicas

- `app/campus/settings/subjects/page.tsx` sigue siendo un archivo grande y con mucha responsabilidad.
- Varias pantallas del campus todavía usan estilos locales y no consumen del todo las utilidades nuevas.
- Hay vistas heredadas con clases antiguas, mezcla de librerías de íconos y problemas de encoding en textos.
- Algunos flujos administrativos todavía merecen una segunda pasada visual para eliminar más estilos inline.

## Componentes o áreas que conviene refactorizar más adelante

- `app/campus/dashboard/page.tsx`
  Aunque quedó más ordenado visualmente, sigue concentrando bastante composición de bloques.

- `app/campus/settings/subjects/page.tsx`
  Conviene separar:
  - toolbar de filtros
  - tabla/listado
  - stats header
  - modal de edición

- `app/globals.css`
  Sería saludable ordenar mejor las utilidades globales por capas y limpiar estilos heredados que ya no aportan.

## Riesgos detectados

- No todas las páginas del campus usan todavía el nuevo sistema visual compacto.
- Hay pantallas que podrían verse algo distintas hasta que se complete una segunda pasada global.
- Persisten textos con encoding incorrecto en partes heredadas; no afectan funcionalidad, pero sí consistencia visual.
- Los modales administrativos complejos todavía pueden requerir más ajuste fino si se quiere una unificación total.

## Recomendaciones futuras

- Extender `dashboard-header`, `app-panel`, `app-input`, `app-select` y `app-table` al resto de settings, perfil, calendario y admin.
- Extraer wrappers reutilizables para:
  - page header
  - metric cards
  - filter toolbar
  - empty state
  - panel lateral
- Unificar librería de íconos gradualmente.
- Hacer una segunda pasada específica de accesibilidad visual y consistencia tipográfica.
- Revisar visualmente las pantallas con más contenido en `1366x768`, `1440x900`, tablet y mobile.

## Checklist de validación manual

- `Sidebar desktop`: verificar alto completo, scroll propio y estabilidad con mucho contenido principal.
- `Sidebar mobile`: abrir/cerrar drawer, revisar overlay y navegación.
- `Dashboard con muchas materias`: confirmar que las `CourseCard` no vuelvan interminable la página.
- `Notebook 1366x768`: validar compactación vertical de header, métricas, cards, paneles y gaps.
- `Tablas`: revisar alineación, hover, padding y overflow horizontal.
- `Formularios`: revisar spacing, labels, campos y acciones.
- `Modales`: confirmar overlay, contenedor, cierre y scroll interno.
- `Overflow vertical y horizontal`: revisar especialmente dashboard y vistas de materias.
- `Jerarquía visual`: confirmar que títulos, subtítulos, badges y CTAs mantengan claridad pese a la compactación.
