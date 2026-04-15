## Responsive layout fix

Se corrigio el shell principal del campus para evitar que la sidebar quedara desplazada en pantallas grandes.

### Que causaba el problema

El layout completo estaba envuelto en un contenedor con `max-w-[1600px]` y `mx-auto`.
Eso centraba todo el shell como un bloque unico, incluyendo la sidebar, y generaba un gutter grande a la izquierda en monitores amplios.

### Que se cambio

- Se elimino el centrado global del shell en `DashboardLayout`.
- La sidebar paso a anclarse al borde izquierdo real del viewport en desktop.
- El contenido principal sigue creciendo de forma flexible y cada pagina conserva su propia estrategia de ancho maximo (`dashboard-page`, `max-w-7xl`, `max-w-4xl`, etc.).
- Se reforzo el uso de `100dvh` para el alto de la sidebar y del contenedor principal.
- Se alinearon tambien paginas de materias y administracion al mismo sistema de wrappers (`dashboard-page`, `dashboard-stack`, `app-panel`) para evitar mini-layouts internos que competian con el shell.

### Criterio para paginas largas de materias

Para paginas con mucho contenido vertical se mantuvo una estrategia `sticky` en desktop, no `fixed`.

Motivos:

- `sticky` acompana el scroll natural del documento.
- evita desacoplar la sidebar del flujo principal.
- reduce problemas de solapamiento, offsets artificiales y cortes de altura.
- funciona mejor cuando el contenido principal puede crecer mucho por acordeones, unidades o secciones expandidas.

En este shell, `sticky top-0` con alto de viewport es la opcion mas estable y mantenible.
