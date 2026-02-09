# 📚 Guía de Implementación - Sistema de Foros

## ✅ Estado Actual: Backend Completado

### 🎯 Resumen del Sistema

El sistema de foros permite:
- **Profesores**: Crear foros por materia/unidad
- **Estudiantes**: Hacer preguntas públicas visibles para todo el curso
- **Todos**: Ver preguntas y respuestas del curso
- **Profesores y Estudiantes**: Responder preguntas (configurable)

---

## 📊 Base de Datos

### Tablas Creadas

#### 1. `forums`
Foros creados por el profesor para una materia o unidad específica.

```sql
- id (UUID)
- subject_id (UUID) → subjects
- unit_id (UUID, opcional) → units
- title (VARCHAR 200)
- description (TEXT)
- created_by (UUID) → users (profesor)
- is_active (BOOLEAN)
- is_locked (BOOLEAN)
- allow_student_answers (BOOLEAN)
- require_approval (BOOLEAN)
- questions_count (INTEGER)
- created_at, updated_at
```

#### 2. `forum_questions`
Preguntas hechas por estudiantes en los foros.

```sql
- id (UUID)
- forum_id (UUID) → forums
- title (VARCHAR 200)
- content (TEXT)
- author_id (UUID) → users
- is_approved (BOOLEAN)
- is_answered (BOOLEAN)
- is_pinned (BOOLEAN)
- is_locked (BOOLEAN)
- views_count (INTEGER)
- answers_count (INTEGER)
- created_at, updated_at, last_activity_at
```

#### 3. `forum_answers`
Respuestas a las preguntas (de profesores o estudiantes).

```sql
- id (UUID)
- question_id (UUID) → forum_questions
- content (TEXT)
- author_id (UUID) → users
- is_teacher_answer (BOOLEAN)
- is_accepted (BOOLEAN)
- is_edited (BOOLEAN)
- likes_count (INTEGER)
- created_at, updated_at
```

#### 4. `forum_answer_likes`
Likes en respuestas.

```sql
- id (UUID)
- answer_id (UUID) → forum_answers
- user_id (UUID) → users
- created_at
```

### Triggers Automáticos

- ✅ Actualiza `questions_count` en `forums` automáticamente
- ✅ Actualiza `answers_count` en `forum_questions` automáticamente
- ✅ Actualiza `likes_count` en `forum_answers` automáticamente
- ✅ Marca `is_answered = true` cuando el profesor responde

---

## 🔒 Seguridad RLS

### Políticas Implementadas

**Forums:**
- SELECT: Estudiantes inscritos y profesores de la materia
- INSERT: Solo profesores
- UPDATE: Solo el creador
- DELETE: Solo el creador o admin

**Forum Questions:**
- SELECT: Todos los del curso (solo preguntas aprobadas para estudiantes)
- INSERT: Estudiantes inscritos
- UPDATE: Autor o profesor
- DELETE: Autor, profesor o admin

**Forum Answers:**
- SELECT: Todos los que pueden ver la pregunta
- INSERT: Estudiantes inscritos (si permitido) y profesores
- UPDATE: Solo el autor
- DELETE: Autor, profesor o admin

**Forum Answer Likes:**
- SELECT: Todos
- INSERT: Usuario autenticado
- DELETE: Solo el propio like

---

## 🔌 API Routes Creadas

### 1. `/api/forums`

#### GET - Listar foros
```typescript
Query params:
- subject_id?: string
- unit_id?: string

Response: Forum[]
```

#### POST - Crear foro (solo profesores)
```typescript
Body: {
  subject_id: string
  unit_id?: string
  title: string
  description?: string
  allow_student_answers?: boolean (default: true)
  require_approval?: boolean (default: false)
}

Response: Forum
```

### 2. `/api/forums/[id]`

#### GET - Obtener foro específico
```typescript
Response: Forum
```

#### PATCH - Actualizar foro (solo creador)
```typescript
Body: {
  title?: string
  description?: string
  is_active?: boolean
  is_locked?: boolean
  allow_student_answers?: boolean
  require_approval?: boolean
}

Response: Forum
```

#### DELETE - Eliminar foro (solo creador o admin)
```typescript
Response: { message: string }
```

### 3. `/api/forums/[id]/questions`

#### GET - Listar preguntas del foro
```typescript
Response: ForumQuestion[]
```

#### POST - Crear pregunta
```typescript
Body: {
  title: string (min 5 chars)
  content: string (min 10 chars)
}

Response: ForumQuestion
```

### 4. `/api/forums/questions/[id]`

#### GET - Obtener pregunta con respuestas
```typescript
Response: ForumQuestion & { answers: ForumAnswer[] }
```

#### PATCH - Actualizar pregunta
```typescript
Body: {
  title?: string
  content?: string
  is_approved?: boolean (solo profesor)
  is_pinned?: boolean (solo profesor)
  is_locked?: boolean (solo profesor)
  is_answered?: boolean (solo profesor)
}

Response: ForumQuestion
```

#### DELETE - Eliminar pregunta
```typescript
Response: { message: string }
```

### 5. `/api/forums/questions/[id]/answers`

#### POST - Crear respuesta
```typescript
Body: {
  content: string
}

Response: ForumAnswer
```

---

## 📝 Pasos para Implementar

### Paso 1: Ejecutar Script SQL ✅ PENDIENTE
```bash
# En Supabase Dashboard → SQL Editor
# Ejecutar: docs/forum-system-schema.sql
```

### Paso 2: Verificar Tablas y Políticas ✅ PENDIENTE
```sql
-- Verificar tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'forum%';

-- Verificar políticas RLS
SELECT tablename, policyname FROM pg_policies 
WHERE tablename LIKE 'forum%';
```

### Paso 3: Crear Interfaz del Profesor 🚧 SIGUIENTE
Crear componentes para que el profesor pueda:
- Ver lista de foros de sus materias
- Crear nuevo foro para una unidad
- Configurar opciones del foro
- Ver preguntas pendientes de aprobación
- Responder preguntas
- Destacar/bloquear preguntas

### Paso 4: Crear Interfaz del Estudiante 🚧 SIGUIENTE
Crear componentes para que el estudiante pueda:
- Ver foros de sus materias
- Ver preguntas del foro
- Hacer una nueva pregunta
- Ver respuestas
- Responder preguntas (si está permitido)
- Dar like a respuestas útiles

---

## 🎨 Componentes a Crear

### Para Profesor:
```
/app/campus/teacher/subjects/[id]/forums/
  ├── page.tsx (lista de foros de la materia)
  ├── [forumId]/
  │   └── page.tsx (vista detallada del foro)
  └── create/
      └── page.tsx (crear nuevo foro)

/components/forums/
  ├── ForumCard.tsx
  ├── CreateForumModal.tsx
  ├── QuestionList.tsx
  ├── QuestionCard.tsx
  └── AnswerForm.tsx
```

### Para Estudiante:
```
/app/campus/student/subjects/[id]/forums/
  ├── page.tsx (lista de foros)
  └── [forumId]/
      ├── page.tsx (preguntas del foro)
      └── [questionId]/
          └── page.tsx (pregunta con respuestas)

/components/forums/
  ├── AskQuestionModal.tsx
  ├── QuestionDetail.tsx
  ├── AnswerCard.tsx
  └── AnswersList.tsx
```

---

## 🔄 Flujo de Uso

### Flujo del Profesor:
1. Accede a una materia
2. Ve la pestaña "Foros"
3. Crea un nuevo foro para una unidad
4. Configura si los estudiantes pueden responder entre ellos
5. Los estudiantes empiezan a hacer preguntas
6. El profesor responde las preguntas
7. Puede destacar preguntas importantes
8. Puede bloquear preguntas resueltas

### Flujo del Estudiante:
1. Accede a una materia
2. Ve la pestaña "Foros"
3. Selecciona un foro
4. Ve las preguntas existentes
5. Hace una nueva pregunta
6. Recibe respuesta del profesor
7. Puede responder preguntas de compañeros (si está permitido)
8. Puede dar like a respuestas útiles

---

## 🎯 Características Implementadas

✅ **Seguridad:**
- RLS completo en todas las tablas
- Solo estudiantes inscritos pueden participar
- Profesores tienen control total de sus foros

✅ **Funcionalidad:**
- Foros por materia o unidad específica
- Preguntas con título y contenido
- Respuestas anidadas
- Sistema de likes
- Contador de vistas
- Destacar preguntas importantes
- Bloquear preguntas/foros
- Aprobación opcional de preguntas

✅ **Optimización:**
- Índices en todas las relaciones
- Triggers para actualizar contadores
- Queries optimizadas con joins

---

## 📌 Próximos Pasos

1. **Ejecutar el script SQL** en Supabase
2. **Crear componentes de UI** para profesor
3. **Crear componentes de UI** para estudiante
4. **Agregar notificaciones** cuando hay nuevas preguntas/respuestas
5. **Agregar búsqueda** en preguntas
6. **Agregar filtros** (sin responder, destacadas, etc.)

---

## 🐛 Testing

### Casos de Prueba:

**Como Profesor:**
- [ ] Crear foro para una materia
- [ ] Crear foro para una unidad específica
- [ ] Ver lista de foros creados
- [ ] Responder pregunta de estudiante
- [ ] Destacar pregunta importante
- [ ] Bloquear pregunta resuelta
- [ ] Eliminar pregunta inapropiada

**Como Estudiante:**
- [ ] Ver foros de mis materias
- [ ] Hacer una pregunta
- [ ] Ver respuesta del profesor
- [ ] Responder pregunta de compañero (si permitido)
- [ ] Dar like a respuesta útil
- [ ] Editar mi pregunta
- [ ] Eliminar mi pregunta

**Seguridad:**
- [ ] Estudiante NO puede ver foros de materias donde no está inscrito
- [ ] Estudiante NO puede crear foros
- [ ] Estudiante NO puede responder si `allow_student_answers = false`
- [ ] Profesor solo ve foros de sus materias

---

## 📚 Recursos

- **Schema SQL**: `docs/forum-system-schema.sql`
- **API Routes**: `app/api/forums/`
- **Documentación RLS**: Ver políticas en el schema

---

**Estado**: ✅ Backend completado - 🚧 Frontend pendiente
**Fecha**: Enero 2026
**Desarrollador**: Bruno Barraud
