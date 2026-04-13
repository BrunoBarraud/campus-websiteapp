# UI Improvement Plan

## Resumen del análisis

Se revisó la estructura del frontend con foco en el shell principal del campus, componentes UI reutilizables y una pantalla administrativa representativa.

Hallazgos principales:

- El layout del campus dependía de una combinación frágil de `sticky`, `min-h-screen` y contenedores sin una jerarquía de overflow claramente separada.
- La sidebar no tenía una estructura pensada como shell de dashboard SaaS: faltaba un contenedor estable de altura completa y scroll interno propio.
- Había inconsistencia visual entre componentes base (`button`, `input`, `textarea`, `select`, `card`) y varias pantallas del campus.
- En la pantalla de usuarios coexistían estilos inline y Tailwind, lo que hacía más difícil mantener consistencia visual y evolución futura.
- La base tipográfica y de superficies era correcta pero demasiado heterogénea en radios, sombras, spacing y jerarquía visual.

## Plan de implementación por fases

### Fase 1: Shell global del campus

- Reforzar el layout del dashboard para comportarse como una app tipo SaaS.
- Hacer que la sidebar ocupe toda la altura visible.
- Mantener scroll interno en la sidebar cuando el contenido exceda la altura.
- Separar correctamente el scroll del contenido principal del scroll lateral.

### Fase 2: Sistema visual reutilizable

- Crear utilidades globales para paneles, tablas y formularios.
- Unificar radios, bordes, sombras, foco y espaciados.
- Mantener los colores existentes, cambiando solo presentación y consistencia.

### Fase 3: Validación en una pantalla real

- Aplicar el nuevo sistema visual a una pantalla administrativa compleja.
- Priorizar seguridad: misma lógica, mismos endpoints, mismos handlers, misma estructura funcional.
- Confirmar que TypeScript siga compilando sin errores.

## Archivos revisados

- `app/campus/layout.tsx`
- `components/dashboard/DashboardLayout.tsx`
- `components/dashboard/DynamicDashboardLayout.tsx`
- `app/globals.css`
- `components/ui/card.tsx`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/select.tsx`
- `components/ui/Pagination.tsx`
- `app/campus/dashboard/page.tsx`
- `app/campus/settings/users/page.tsx`
- `app/campus/profile/page.tsx`
- `components/dashboard/CourseCard.tsx`
- `app/layout.tsx`
- `package.json`

## Archivos modificados

- `components/dashboard/DashboardLayout.tsx`
- `app/globals.css`
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/select.tsx`
- `components/ui/Pagination.tsx`
- `app/campus/settings/users/page.tsx`

Nota:

- `package-lock.json` ya aparecía modificado en el worktree al momento de revisar `git status`. No fue parte de esta intervención visual.

## Cambios aplicados

### 1. Estructura global del dashboard

- Se rediseñó el shell del campus para que funcione como dashboard robusto.
- La sidebar desktop ahora vive dentro de un contenedor `sticky` con `h-screen`.
- La navegación lateral tiene `overflow-y-auto` propio.
- El contenido principal quedó desacoplado del scroll lateral y mantiene `min-h-screen`.
- En mobile se mejoró el drawer lateral con overlay más claro y cierre visible.
- Se refinó la bottom navigation mobile para que sea más consistente con el resto del sistema.

### 2. Utilidades visuales globales

En `app/globals.css` se agregaron utilidades reutilizables:

- `.dashboard-shell`
- `.dashboard-main`
- `.dashboard-sidebar`
- `.app-surface`
- `.app-panel`
- `.app-panel-muted`
- `.app-input`
- `.app-select`
- `.app-textarea`
- `.app-button-soft`
- `.app-table`

Esto permite centralizar superficies, formularios y tablas sin duplicar estilos por pantalla.

### 3. Componentes UI base

Se actualizaron:

- `button`
- `input`
- `textarea`
- `select`
- `card`
- `Pagination`

Mejoras aplicadas:

- radios más consistentes
- alturas uniformes
- sombras más limpias
- estados hover/focus más profesionales
- mejor legibilidad y jerarquía
- estética alineada con dashboard administrativo moderno

### 4. Pantalla de usuarios

Se mejoró visualmente `app/campus/settings/users/page.tsx`:

- header con mejor jerarquía
- tarjetas de métricas más consistentes
- bloque de filtros más limpio y ordenado
- tabla con estilo unificado y mejor legibilidad
- modal de edición/creación convertido a una presentación más mantenible
- resultados de importación con paneles y estados visuales más claros

No se alteró:

- lógica de fetch
- endpoints
- handlers
- paginación
- importación/exportación
- estructura funcional del módulo

## Problemas detectados

- Hay otras pantallas del campus con estilos locales y patrones visuales propios que todavía no consumen del todo las nuevas utilidades globales.
- Existen varios componentes/páginas con mezcla de Tailwind e inline styles.
- Algunas vistas usan íconos Font Awesome directamente y otras usan `lucide-react` o `react-icons`, lo que produce diferencias visuales.
- Todavía hay copy y strings con problemas de encoding en varios archivos heredados.

## Observaciones técnicas

- La corrección crítica de sidebar se resolvió sin tocar rutas ni componentes funcionales externos al shell.
- La solución elegida evita cambios de negocio y se apoya en composición de layout + overflow controlado.
- `npx tsc --noEmit` se ejecutó correctamente después de los cambios.
- No se cambiaron nombres de componentes, rutas ni contratos públicos.

## Código que convendría mejorar o refactorizar

- Centralizar más formularios sobre componentes UI base en vez de repetir clases locales.
- Llevar tablas administrativas a un patrón reusable de tabla/panel.
- Reducir estilos inline en modales y pantallas legacy.
- Revisar consistencia entre `react-icons`, Font Awesome y `lucide-react`.
- Normalizar textos con encoding incorrecto.

## Funciones o componentes que podrían estar mejor programados

- `components/dashboard/DashboardLayout.tsx`
  Antes tenía bastante repetición para cada bloque de navegación; ahora quedó mejor, pero todavía podría extraerse parte del shell a componentes más pequeños.

- `app/campus/settings/users/page.tsx`
  Sigue concentrando bastante responsabilidad en un solo archivo:
  filtros, tabla, import/export, modal, resultados y estado de paginación.
  En una fase futura convendría dividirlo en subcomponentes visuales.

- `app/globals.css`
  Tiene muchos estilos globales heredados que mezclan utilidades antiguas y nuevas. Conviene ordenar por capas (`base`, `components`, `utilities`) cuando se haga una limpieza mayor.

## Recomendaciones futuras

- Migrar gradualmente otras pantallas del campus a `app-panel`, `app-input`, `app-select`, `app-table`.
- Revisar dashboard, perfil, calendario y settings para que compartan la misma jerarquía visual.
- Crear wrappers reutilizables para:
  - page header
  - stats cards
  - data table shell
  - modal shell
  - filter toolbar
- Unificar librería de íconos.
- Agregar revisión visual responsive por breakpoint en las pantallas más usadas.
- Hacer una segunda pasada específica de accesibilidad visual y consistencia tipográfica.
