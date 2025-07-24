# Sistema de Permisos - Campus Website

## Resumen de Roles y Permisos

### 🔑 **ADMINISTRADOR**
- **Acceso completo**: Puede gestionar todo el sistema
- **Gestión de usuarios**: Crear, editar, eliminar usuarios
- **Gestión de materias**: Crear, editar, eliminar cualquier materia
- **Acceso a estadísticas**: Ver datos de todo el sistema
- **URL Dashboard**: `/campus/dashboard`

### 👨‍🏫 **PROFESOR**
- **Gestión de SUS materias**: Solo puede editar materias donde es el profesor asignado
- **Crear asignaciones**: Puede crear tareas para sus materias
- **Calificar tareas**: Puede ver y calificar entregas de estudiantes
- **Gestionar contenido**: Subir documentos, crear unidades
- **Cambiar imagen**: Puede personalizar la imagen de presentación de sus materias
- **URL Dashboard**: `/campus/teacher`

### 👨‍🎓 **ESTUDIANTE**
- **Ver materias**: Solo puede ver materias de su año y división
- **Entregar tareas**: Puede subir documentos para las asignaciones
- **Ver calificaciones**: Puede ver sus propias notas
- **Descargar materiales**: Puede acceder a documentos de estudio
- **URL Dashboard**: `/campus/student`

## APIs y Permisos

### Materias (`/api/subjects/[id]`)
- **GET**: Todos los roles autenticados (con filtros por año para estudiantes)
- **PUT**: Solo profesor de la materia + admin
- **DELETE**: Solo admin

### Asignaciones (`/api/subjects/[id]/assignments`)
- **GET**: Todos los roles autenticados
- **POST**: Solo profesor de la materia + admin

### Entregas (`/api/subjects/[id]/assignments/[assignmentId]/submissions`)
- **GET**: Profesor de la materia + admin + estudiante propietario
- **POST**: Solo estudiantes (para sus propias entregas)

## Funciones Helper

### `requireRole(['admin', 'teacher'])`
Verifica que el usuario tenga uno de los roles especificados.

### `requireSubjectTeacher(subjectId)`
Verifica que el usuario sea profesor de la materia específica o admin.

### `checkPageAccess(['teacher'])`
Para uso en páginas, verifica acceso y redirige automáticamente.

## Flujo de Trabajo

### Para Profesores:
1. Login → Dashboard de profesor
2. Ve sus materias asignadas
3. Puede editar: nombre, descripción, imagen, división
4. Puede crear unidades y documentos
5. Puede crear asignaciones con fecha límite
6. Puede ver entregas de estudiantes y calificar

### Para Estudiantes:
1. Login → Dashboard de estudiante  
2. Ve solo materias de su año/división
3. Puede ver asignaciones pendientes
4. Puede entregar trabajos (upload de archivos)
5. Puede ver sus calificaciones

### Para Admins:
1. Login → Dashboard completo
2. Gestión total del sistema
3. Puede crear/editar usuarios
4. Puede gestionar cualquier materia
5. Acceso a reportes y estadísticas

## Próximos Pasos

- [ ] Implementar sistema de calificaciones
- [ ] Agregar notificaciones para entregas
- [ ] Sistema de comentarios en asignaciones
- [ ] Dashboard con estadísticas para profesores
- [ ] Calendario de entregas para estudiantes
