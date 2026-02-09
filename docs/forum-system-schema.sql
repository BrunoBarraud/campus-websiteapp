-- ============================================================================
-- SISTEMA DE FOROS POR UNIDAD - CAMPUS VIRTUAL
-- ============================================================================
-- Flujo del sistema:
-- 1. El PROFESOR crea un foro para una unidad/materia
-- 2. Los ESTUDIANTES hacen preguntas en el foro
-- 3. TODOS los estudiantes del curso pueden ver las preguntas
-- 4. El PROFESOR y otros ESTUDIANTES pueden responder
-- 5. Las preguntas y respuestas son públicas para todo el curso
-- ============================================================================

-- ============================================================================
-- TABLA: forums (Foros creados por el profesor)
-- ============================================================================

CREATE TABLE IF NOT EXISTS forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con materia y unidad
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
    
    -- Información del foro
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Creador (profesor)
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Estado
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false, -- Si está bloqueado, no se pueden hacer más preguntas
    
    -- Configuración
    allow_student_answers BOOLEAN DEFAULT true, -- Si los estudiantes pueden responder entre ellos
    require_approval BOOLEAN DEFAULT false, -- Si las preguntas requieren aprobación del profesor
    
    -- Estadísticas
    questions_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT forums_title_length CHECK (char_length(title) >= 3)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_forums_subject ON forums(subject_id);
CREATE INDEX IF NOT EXISTS idx_forums_unit ON forums(unit_id);
CREATE INDEX IF NOT EXISTS idx_forums_creator ON forums(created_by);
CREATE INDEX IF NOT EXISTS idx_forums_active ON forums(is_active, created_at DESC);

-- ============================================================================
-- TABLA: forum_questions (Preguntas de estudiantes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con foro
    forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
    
    -- Contenido de la pregunta
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    
    -- Autor (estudiante)
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Estado
    is_approved BOOLEAN DEFAULT true, -- Si requiere aprobación del profesor
    is_answered BOOLEAN DEFAULT false, -- Si tiene respuesta del profesor
    is_pinned BOOLEAN DEFAULT false, -- Destacada por el profesor
    is_locked BOOLEAN DEFAULT false, -- No se pueden agregar más respuestas
    
    -- Estadísticas
    views_count INTEGER DEFAULT 0,
    answers_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT forum_questions_title_length CHECK (char_length(title) >= 5),
    CONSTRAINT forum_questions_content_length CHECK (char_length(content) >= 10)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_forum_questions_forum ON forum_questions(forum_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_author ON forum_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_questions_activity ON forum_questions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_pinned ON forum_questions(forum_id, is_pinned DESC, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_answered ON forum_questions(forum_id, is_answered);

-- ============================================================================
-- TABLA: forum_answers (Respuestas a preguntas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relación con pregunta
    question_id UUID NOT NULL REFERENCES forum_questions(id) ON DELETE CASCADE,
    
    -- Contenido de la respuesta
    content TEXT NOT NULL,
    
    -- Autor (puede ser profesor o estudiante)
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Estado
    is_teacher_answer BOOLEAN DEFAULT false, -- Si es respuesta del profesor
    is_accepted BOOLEAN DEFAULT false, -- Si el profesor marcó esta como la respuesta correcta
    is_edited BOOLEAN DEFAULT false,
    
    -- Reacciones
    likes_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT forum_answers_content_length CHECK (char_length(content) >= 1)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_forum_answers_question ON forum_answers(question_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_answers_author ON forum_answers(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_answers_teacher ON forum_answers(question_id, is_teacher_answer);
CREATE INDEX IF NOT EXISTS idx_forum_answers_accepted ON forum_answers(question_id, is_accepted);

-- ============================================================================
-- TABLA: forum_answer_likes (Likes en respuestas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS forum_answer_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID NOT NULL REFERENCES forum_answers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Un usuario solo puede dar like una vez por respuesta
    UNIQUE(answer_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_answer_likes_answer ON forum_answer_likes(answer_id);
CREATE INDEX IF NOT EXISTS idx_forum_answer_likes_user ON forum_answer_likes(user_id);

-- ============================================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================================

-- Función para actualizar el contador de preguntas en forums
CREATE OR REPLACE FUNCTION update_forum_questions_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forums 
        SET questions_count = questions_count + 1,
            updated_at = NOW()
        WHERE id = NEW.forum_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forums 
        SET questions_count = GREATEST(0, questions_count - 1),
            updated_at = NOW()
        WHERE id = OLD.forum_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_forum_questions_count
AFTER INSERT OR DELETE ON forum_questions
FOR EACH ROW EXECUTE FUNCTION update_forum_questions_count();

-- Función para actualizar el contador de respuestas en forum_questions
CREATE OR REPLACE FUNCTION update_question_answers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_questions 
        SET answers_count = answers_count + 1,
            last_activity_at = NOW(),
            updated_at = NOW(),
            is_answered = CASE 
                WHEN (SELECT role FROM users WHERE id = NEW.author_id) = 'teacher' 
                THEN true 
                ELSE is_answered 
            END
        WHERE id = NEW.question_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_questions 
        SET answers_count = GREATEST(0, answers_count - 1),
            updated_at = NOW()
        WHERE id = OLD.question_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_answers_count
AFTER INSERT OR DELETE ON forum_answers
FOR EACH ROW EXECUTE FUNCTION update_question_answers_count();

-- Función para actualizar el contador de likes
CREATE OR REPLACE FUNCTION update_answer_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_answers 
        SET likes_count = likes_count + 1
        WHERE id = NEW.answer_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_answers 
        SET likes_count = GREATEST(0, likes_count - 1)
        WHERE id = OLD.answer_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_answer_likes_count
AFTER INSERT OR DELETE ON forum_answer_likes
FOR EACH ROW EXECUTE FUNCTION update_answer_likes_count();

-- ============================================================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_answer_likes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Políticas para FORUMS
-- ---------------------------------------------------------------------------

-- SELECT: Estudiantes y profesores pueden ver foros de sus materias
CREATE POLICY "forums_select_enrolled" ON forums
    FOR SELECT
    TO authenticated
    USING (
        -- Profesores pueden ver foros de sus materias
        EXISTS (
            SELECT 1 FROM subjects s
            WHERE s.id = subject_id
            AND s.teacher_id = auth.uid()
        )
        OR
        -- Estudiantes pueden ver foros de materias donde están inscritos
        EXISTS (
            SELECT 1 FROM subject_enrollments se
            WHERE se.subject_id = subject_id
            AND se.student_id = auth.uid()
            AND se.is_active = true
        )
        OR
        -- Admins pueden ver todos
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- INSERT: Solo profesores pueden crear foros
CREATE POLICY "forums_insert_teacher" ON forums
    FOR INSERT
    TO authenticated
    WITH CHECK (
        created_by = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role IN ('teacher', 'admin')
        )
    );

-- UPDATE: Solo el profesor creador puede actualizar
CREATE POLICY "forums_update_creator" ON forums
    FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- DELETE: Solo el profesor creador o admin pueden eliminar
CREATE POLICY "forums_delete_creator_or_admin" ON forums
    FOR DELETE
    TO authenticated
    USING (
        created_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- ---------------------------------------------------------------------------
-- Políticas para FORUM_QUESTIONS
-- ---------------------------------------------------------------------------

-- SELECT: Todos los estudiantes del curso pueden ver preguntas aprobadas
CREATE POLICY "forum_questions_select_enrolled" ON forum_questions
    FOR SELECT
    TO authenticated
    USING (
        is_approved = true
        AND
        (
            -- Estudiantes inscritos en la materia
            EXISTS (
                SELECT 1 FROM forums f
                JOIN subject_enrollments se ON se.subject_id = f.subject_id
                WHERE f.id = forum_id
                AND se.student_id = auth.uid()
                AND se.is_active = true
            )
            OR
            -- Profesor de la materia
            EXISTS (
                SELECT 1 FROM forums f
                JOIN subjects s ON s.id = f.subject_id
                WHERE f.id = forum_id
                AND s.teacher_id = auth.uid()
            )
            OR
            -- Autor de la pregunta (puede ver su propia pregunta aunque no esté aprobada)
            author_id = auth.uid()
            OR
            -- Admins
            EXISTS (
                SELECT 1 FROM users u
                WHERE u.id = auth.uid()
                AND u.role = 'admin'
            )
        )
    );

-- INSERT: Estudiantes inscritos pueden hacer preguntas
CREATE POLICY "forum_questions_insert_student" ON forum_questions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM forums f
            JOIN subject_enrollments se ON se.subject_id = f.subject_id
            WHERE f.id = forum_id
            AND se.student_id = auth.uid()
            AND se.is_active = true
            AND f.is_active = true
            AND f.is_locked = false
        )
    );

-- UPDATE: Solo el autor o profesor pueden actualizar
CREATE POLICY "forum_questions_update_own_or_teacher" ON forum_questions
    FOR UPDATE
    TO authenticated
    USING (
        author_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM forums f
            JOIN subjects s ON s.id = f.subject_id
            WHERE f.id = forum_id
            AND s.teacher_id = auth.uid()
        )
    )
    WITH CHECK (
        author_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM forums f
            JOIN subjects s ON s.id = f.subject_id
            WHERE f.id = forum_id
            AND s.teacher_id = auth.uid()
        )
    );

-- DELETE: Solo el autor, profesor o admin pueden eliminar
CREATE POLICY "forum_questions_delete_own_or_teacher" ON forum_questions
    FOR DELETE
    TO authenticated
    USING (
        author_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM forums f
            JOIN subjects s ON s.id = f.subject_id
            WHERE f.id = forum_id
            AND s.teacher_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- ---------------------------------------------------------------------------
-- Políticas para FORUM_ANSWERS
-- ---------------------------------------------------------------------------

-- SELECT: Todos los que pueden ver la pregunta pueden ver las respuestas
CREATE POLICY "forum_answers_select_enrolled" ON forum_answers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM forum_questions fq
            JOIN forums f ON f.id = fq.forum_id
            JOIN subject_enrollments se ON se.subject_id = f.subject_id
            WHERE fq.id = question_id
            AND se.student_id = auth.uid()
            AND se.is_active = true
        )
        OR
        EXISTS (
            SELECT 1 FROM forum_questions fq
            JOIN forums f ON f.id = fq.forum_id
            JOIN subjects s ON s.id = f.subject_id
            WHERE fq.id = question_id
            AND s.teacher_id = auth.uid()
        )
        OR
        author_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- INSERT: Estudiantes inscritos y profesores pueden responder
CREATE POLICY "forum_answers_insert_enrolled" ON forum_answers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        author_id = auth.uid()
        AND
        (
            -- Estudiantes inscritos (si está permitido)
            EXISTS (
                SELECT 1 FROM forum_questions fq
                JOIN forums f ON f.id = fq.forum_id
                JOIN subject_enrollments se ON se.subject_id = f.subject_id
                WHERE fq.id = question_id
                AND se.student_id = auth.uid()
                AND se.is_active = true
                AND f.allow_student_answers = true
                AND fq.is_locked = false
            )
            OR
            -- Profesores siempre pueden responder
            EXISTS (
                SELECT 1 FROM forum_questions fq
                JOIN forums f ON f.id = fq.forum_id
                JOIN subjects s ON s.id = f.subject_id
                WHERE fq.id = question_id
                AND s.teacher_id = auth.uid()
            )
        )
    );

-- UPDATE: Solo el autor puede actualizar su respuesta
CREATE POLICY "forum_answers_update_own" ON forum_answers
    FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- DELETE: Solo el autor, profesor o admin pueden eliminar
CREATE POLICY "forum_answers_delete_own_or_teacher" ON forum_answers
    FOR DELETE
    TO authenticated
    USING (
        author_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM forum_questions fq
            JOIN forums f ON f.id = fq.forum_id
            JOIN subjects s ON s.id = f.subject_id
            WHERE fq.id = question_id
            AND s.teacher_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- ---------------------------------------------------------------------------
-- Políticas para FORUM_ANSWER_LIKES
-- ---------------------------------------------------------------------------

-- SELECT: Todos pueden ver los likes
CREATE POLICY "forum_answer_likes_select_all" ON forum_answer_likes
    FOR SELECT
    TO authenticated
    USING (true);

-- INSERT: Usuarios autenticados pueden dar like
CREATE POLICY "forum_answer_likes_insert_own" ON forum_answer_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- DELETE: Solo el usuario puede quitar su propio like
CREATE POLICY "forum_answer_likes_delete_own" ON forum_answer_likes
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Verificar que las tablas se crearon correctamente
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('forums', 'forum_questions', 'forum_answers', 'forum_answer_likes')
ORDER BY table_name;

-- Verificar políticas RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('forums', 'forum_questions', 'forum_answers', 'forum_answer_likes')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================

/*
FLUJO DE USO:

1. PROFESOR crea un foro:
   - Asociado a una materia y opcionalmente a una unidad
   - Define si los estudiantes pueden responder entre ellos
   - Define si las preguntas requieren aprobación

2. ESTUDIANTE hace una pregunta:
   - Solo si está inscrito en la materia
   - La pregunta es visible para todos los estudiantes del curso
   - Si require_approval=true, el profesor debe aprobarla primero

3. RESPUESTAS:
   - El profesor puede responder siempre
   - Los estudiantes pueden responder si allow_student_answers=true
   - Las respuestas son visibles para todos

4. INTERACCIONES:
   - Los estudiantes pueden dar like a respuestas útiles
   - El profesor puede marcar una respuesta como "aceptada"
   - El profesor puede destacar (pin) preguntas importantes
   - El profesor puede bloquear preguntas (no más respuestas)

PERMISOS:
- Estudiantes: Ver foros de sus materias, hacer preguntas, responder (si está permitido)
- Profesores: Crear foros, ver todas las preguntas, responder, moderar
- Admins: Acceso completo
*/
