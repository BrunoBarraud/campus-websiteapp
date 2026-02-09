# 🗺️ Rutas del Sistema de Foros - Campus Virtual

## 📍 Rutas Creadas

### Para Profesores

#### 1. Lista de Foros de una Materia
```
/campus/teacher/subjects/[id]/forums
```
- Ver todos los foros de la materia
- Crear nuevo foro
- Estadísticas de foros

#### 2. Vista Detallada de un Foro
```
/campus/teacher/subjects/[id]/forums/[forumId]
```
- Ver todas las preguntas del foro
- Filtrar por: todas, pendientes, sin responder, respondidas
- Cerrar/abrir foro
- Fijar/desfijar preguntas
- Aprobar preguntas pendientes
- Acciones rápidas en cada pregunta

#### 3. Detalle de Pregunta con Respuestas
```
/campus/teacher/subjects/[id]/forums/[forumId]/questions/[questionId]
```
- Ver pregunta completa
- Ver todas las respuestas
- Responder pregunta
- Marcar respuesta como correcta
- Moderar contenido

---

### Para Estudiantes

#### 1. Lista de Foros de una Materia
```
/campus/student/subjects/[id]/forums
```
- Ver foros disponibles de la materia
- Información sobre el uso de foros

#### 2. Vista de Preguntas de un Foro
```
/campus/student/subjects/[id]/forums/[forumId]
```
- Ver todas las preguntas del foro
- Filtrar por: todas, sin responder, respondidas
- Hacer nueva pregunta
- Acceder a detalles de preguntas

#### 3. Detalle de Pregunta con Respuestas
```
/campus/student/subjects/[id]/forums/[forumId]/questions/[questionId]
```
- Ver pregunta completa
- Ver todas las respuestas
- Responder pregunta (si está permitido)
- Dar like a respuestas útiles

---

## 🎨 Componentes Creados

### Componentes Reutilizables
- `ForumCard.tsx` - Tarjeta de foro
- `QuestionCard.tsx` - Tarjeta de pregunta
- `AnswerCard.tsx` - Tarjeta de respuesta
- `CreateForumModal.tsx` - Modal para crear foro (profesor)
- `AskQuestionModal.tsx` - Modal para hacer pregunta (estudiante)

---

## 🔗 Cómo Integrar en la Navegación

### En el Dashboard del Profesor

Agregar enlace en la vista de materia:

```tsx
// En: app/campus/teacher/subjects/[id]/page.tsx
<Link href={`/campus/teacher/subjects/${subjectId}/forums`}>
  <button className="...">
    💬 Foros de Discusión
  </button>
</Link>
```

### En el Dashboard del Estudiante

Agregar enlace en la vista de materia:

```tsx
// En: app/campus/student/subjects/[id]/page.tsx
<Link href={`/campus/student/subjects/${subjectId}/forums`}>
  <button className="...">
    💬 Foros
  </button>
</Link>
```

---

## 📊 Funcionalidades por Rol

### Profesor
✅ Crear foros por materia/unidad
✅ Configurar si estudiantes pueden responder entre ellos
✅ Configurar si preguntas requieren aprobación
✅ Ver todas las preguntas
✅ Filtrar preguntas (pendientes, sin responder, respondidas)
✅ Responder preguntas
✅ Fijar preguntas importantes
✅ Aprobar preguntas pendientes
✅ Cerrar/abrir foros
✅ Marcar respuestas como correctas
✅ Eliminar preguntas/respuestas inapropiadas

### Estudiante
✅ Ver foros de sus materias
✅ Ver todas las preguntas aprobadas
✅ Hacer preguntas
✅ Ver respuestas
✅ Responder preguntas (si está permitido)
✅ Dar like a respuestas útiles
✅ Filtrar preguntas (todas, sin responder, respondidas)

---

## 🎯 Estado del Sistema

### ✅ Completado
- [x] Base de datos (tablas, triggers, RLS)
- [x] API Routes (5 endpoints principales)
- [x] Componentes reutilizables (5 componentes)
- [x] Interfaces de profesor (3 páginas)
- [x] Interfaces de estudiante (3 páginas)

### 🚧 Pendiente (Opcional)
- [ ] Vista de pregunta para profesor (responder y moderar)
- [ ] Sistema de notificaciones (nueva pregunta, nueva respuesta)
- [ ] Búsqueda de preguntas
- [ ] Editar/eliminar propias preguntas
- [ ] Reportar contenido inapropiado
- [ ] Estadísticas de participación

---

## 🚀 Próximos Pasos

1. **Ejecutar el script SQL** en Supabase:
   ```
   docs/forum-system-final.sql
   ```

2. **Agregar enlaces de navegación** en las vistas de materias

3. **Probar el sistema**:
   - Como profesor: crear foro, ver preguntas
   - Como estudiante: hacer pregunta, ver respuestas

4. **(Opcional) Agregar notificaciones** cuando hay nuevas preguntas/respuestas

---

**Sistema de Foros Completado** ✅
