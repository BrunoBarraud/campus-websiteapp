# 📚 Sistema de Gestión de Unidades y Tareas - Campus Virtual

## ✨ Nueva Funcionalidad Implementada

Se ha integrado un sistema completo de gestión de unidades y tareas dentro de cada materia individual para profesores.

### 🎯 Ubicación de la Funcionalidad

**Para Profesores:**

1. Iniciar sesión con rol de `teacher`
2. Ir al **Dashboard** principal
3. Hacer clic en cualquier **tarjeta de materia**
4. En la página de la materia, hacer clic en **"Gestionar Unidades y Tareas"**

### 🔧 Funcionalidades Disponibles

#### 📝 Gestión de Unidades

- ✅ **Crear unidades**: Agregar unidades temáticas con título y descripción
- ✅ **Editar unidades**: Modificar información de unidades existentes
- ✅ **Eliminar unidades**: Remover unidades (con confirmación)
- ✅ **Reordenar unidades**: Cambiar el orden de presentación

#### 📋 Gestión de Tareas

- ✅ **Crear tareas**: Asignar tareas con los siguientes campos:
  - Título y descripción
  - Fecha límite de entrega
  - Puntuación máxima
  - **Archivos adjuntos** (PDF, Word, Excel, PowerPoint, imágenes)
- ✅ **Activar/Desactivar tareas**: Control de visibilidad para estudiantes
- ✅ **Ver entregas**: Revisar las entregas de todos los estudiantes
- ✅ **Calificar entregas**: Asignar notas y retroalimentación

#### 📤 Sistema de Entregas (Para Estudiantes)

- ✅ **Ver tareas activas**: Solo tareas habilitadas por el profesor
- ✅ **Subir entregas**: Texto y/o archivos adjuntos
- ✅ **Detección de entregas tardías**: Marcado automático
- ✅ **Ver calificaciones**: Notas y comentarios del profesor

### 🗂️ Archivos Soportados

**Para Tareas (Profesores):**

- Documentos: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), PowerPoint (.ppt, .pptx)
- Imágenes: JPEG, PNG, GIF, WebP
- Texto: TXT
- **Tamaño máximo**: 50MB por archivo

**Para Entregas (Estudiantes):**

- Todos los formatos anteriores, más:
- Comprimidos: ZIP, RAR
- **Tamaño máximo**: 100MB por archivo

### 🚀 Cómo Usar

1. **Crear una Unidad:**

   - Hacer clic en "Nueva Unidad"
   - Completar título y descripción
   - Guardar

2. **Crear una Tarea:**

   - Seleccionar la unidad correspondiente
   - Hacer clic en "Nueva Tarea"
   - Completar información de la tarea
   - Adjuntar archivo si es necesario
   - **Importante**: Activar la tarea para que sea visible a estudiantes

3. **Gestionar Entregas:**
   - Las entregas aparecen automáticamente cuando los estudiantes las suben
   - Hacer clic en "Ver Entregas" para calificar
   - Asignar nota y comentarios

### 🔧 APIs Disponibles

#### Unidades

- `GET /api/subjects/[id]/units` - Listar unidades
- `POST /api/subjects/[id]/units` - Crear unidad
- `PUT /api/subjects/[id]/units` - Actualizar unidad
- `DELETE /api/subjects/[id]/units` - Eliminar unidad

#### Tareas

- `GET /api/subjects/[id]/assignments` - Listar tareas
- `POST /api/subjects/[id]/assignments` - Crear tarea (con FormData para archivos)

#### Entregas

- `GET /api/subjects/[id]/assignments/[assignmentId]/submissions` - Ver entregas
- `POST /api/subjects/[id]/assignments/[assignmentId]/submissions` - Subir entrega (estudiantes)
- `PUT /api/subjects/[id]/assignments/[assignmentId]/submissions` - Calificar entrega (profesores)

### 🗄️ Base de Datos

**Tablas utilizadas:**

- `subject_units`: Unidades temáticas
- `assignments`: Tareas con archivos adjuntos
- `assignment_submissions`: Entregas de estudiantes

**Storage Buckets:**

- `assignment-files`: Archivos adjuntos de tareas
- `submission-files`: Archivos de entregas de estudiantes

### 💡 Notas Importantes

1. **Archivos**: Se almacenan en Supabase Storage con URLs públicas
2. **Permisos**: Solo profesores pueden gestionar unidades y tareas
3. **Visibilidad**: Las tareas deben estar activas para ser vistas por estudiantes
4. **Entregas tardías**: Se marcan automáticamente según la fecha límite

### 🎯 Próximas Mejoras Sugeridas

- [ ] Notificaciones automáticas de nuevas tareas
- [ ] Historial de versiones de entregas
- [ ] Rubrica de evaluación personalizable
- [ ] Estadísticas de rendimiento por unidad
- [ ] Exportación de calificaciones

---

**Desarrollado con ❤️ para el Campus Virtual**
