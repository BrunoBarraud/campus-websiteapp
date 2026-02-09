-- ============================================================================
-- SISTEMA DE FOROS - CAMPUS VIRTUAL (VERSIÓN FINAL)
-- ============================================================================
-- Corregido para usar las tablas existentes:
-- - subject_units (en lugar de units)
-- - student_subjects (en lugar de subject_enrollments)
-- ============================================================================

-- ============================================================================
-- TABLAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS forums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES subject_units(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT true,
    is_locked BOOLEAN DEFAULT false,
    allow_student_answers BOOLEAN DEFAULT true,
    require_approval BOOLEAN DEFAULT false,
    questions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT forums_title_length CHECK (char_length(title) >= 3)
);

CREATE TABLE IF NOT EXISTS forum_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id UUID NOT NULL REFERENCES forums(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_approved BOOLEAN DEFAULT true,
    is_answered BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    views_count INTEGER DEFAULT 0,
    answers_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT forum_questions_title_length CHECK (char_length(title) >= 5),
    CONSTRAINT forum_questions_content_length CHECK (char_length(content) >= 10)
);

CREATE TABLE IF NOT EXISTS forum_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES forum_questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_teacher_answer BOOLEAN DEFAULT false,
    is_accepted BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT forum_answers_content_length CHECK (char_length(content) >= 1)
);

CREATE TABLE IF NOT EXISTS forum_answer_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID NOT NULL REFERENCES forum_answers(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(answer_id, user_id)
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_forums_subject ON forums(subject_id);
CREATE INDEX IF NOT EXISTS idx_forums_unit ON forums(unit_id);
CREATE INDEX IF NOT EXISTS idx_forums_creator ON forums(created_by);
CREATE INDEX IF NOT EXISTS idx_forums_active ON forums(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_questions_forum ON forum_questions(forum_id, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_author ON forum_questions(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_questions_activity ON forum_questions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_pinned ON forum_questions(forum_id, is_pinned DESC, last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_questions_answered ON forum_questions(forum_id, is_answered);

CREATE INDEX IF NOT EXISTS idx_forum_answers_question ON forum_answers(question_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_answers_author ON forum_answers(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_answers_teacher ON forum_answers(question_id, is_teacher_answer);
CREATE INDEX IF NOT EXISTS idx_forum_answers_accepted ON forum_answers(question_id, is_accepted);

CREATE INDEX IF NOT EXISTS idx_forum_answer_likes_answer ON forum_answer_likes(answer_id);
CREATE INDEX IF NOT EXISTS idx_forum_answer_likes_user ON forum_answer_likes(user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_forum_questions_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forums SET questions_count = questions_count + 1, updated_at = NOW() WHERE id = NEW.forum_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forums SET questions_count = GREATEST(0, questions_count - 1), updated_at = NOW() WHERE id = OLD.forum_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_forum_questions_count ON forum_questions;
CREATE TRIGGER trigger_update_forum_questions_count
AFTER INSERT OR DELETE ON forum_questions
FOR EACH ROW EXECUTE FUNCTION update_forum_questions_count();

CREATE OR REPLACE FUNCTION update_question_answers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_questions 
        SET answers_count = answers_count + 1,
            last_activity_at = NOW(),
            updated_at = NOW(),
            is_answered = CASE WHEN (SELECT role FROM users WHERE id = NEW.author_id) = 'teacher' THEN true ELSE is_answered END
        WHERE id = NEW.question_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_questions SET answers_count = GREATEST(0, answers_count - 1), updated_at = NOW() WHERE id = OLD.question_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_question_answers_count ON forum_answers;
CREATE TRIGGER trigger_update_question_answers_count
AFTER INSERT OR DELETE ON forum_answers
FOR EACH ROW EXECUTE FUNCTION update_question_answers_count();

CREATE OR REPLACE FUNCTION update_answer_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE forum_answers SET likes_count = likes_count + 1 WHERE id = NEW.answer_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE forum_answers SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.answer_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_answer_likes_count ON forum_answer_likes;
CREATE TRIGGER trigger_update_answer_likes_count
AFTER INSERT OR DELETE ON forum_answer_likes
FOR EACH ROW EXECUTE FUNCTION update_answer_likes_count();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_answer_likes ENABLE ROW LEVEL SECURITY;

-- FORUMS
DROP POLICY IF EXISTS "forums_select_enrolled" ON forums;
CREATE POLICY "forums_select_enrolled" ON forums FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM subjects s WHERE s.id = subject_id AND s.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM student_subjects ss WHERE ss.subject_id = subject_id AND ss.student_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

DROP POLICY IF EXISTS "forums_insert_teacher" ON forums;
CREATE POLICY "forums_insert_teacher" ON forums FOR INSERT TO authenticated WITH CHECK (
    created_by = auth.uid() AND EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('teacher', 'admin'))
);

DROP POLICY IF EXISTS "forums_update_creator" ON forums;
CREATE POLICY "forums_update_creator" ON forums FOR UPDATE TO authenticated
USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "forums_delete_creator_or_admin" ON forums;
CREATE POLICY "forums_delete_creator_or_admin" ON forums FOR DELETE TO authenticated USING (
    created_by = auth.uid() OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- FORUM_QUESTIONS
DROP POLICY IF EXISTS "forum_questions_select_enrolled" ON forum_questions;
CREATE POLICY "forum_questions_select_enrolled" ON forum_questions FOR SELECT TO authenticated USING (
    is_approved = true AND (
        EXISTS (SELECT 1 FROM forums f JOIN student_subjects ss ON ss.subject_id = f.subject_id WHERE f.id = forum_id AND ss.student_id = auth.uid())
        OR EXISTS (SELECT 1 FROM forums f JOIN subjects s ON s.id = f.subject_id WHERE f.id = forum_id AND s.teacher_id = auth.uid())
        OR author_id = auth.uid()
        OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
    )
);

DROP POLICY IF EXISTS "forum_questions_insert_student" ON forum_questions;
CREATE POLICY "forum_questions_insert_student" ON forum_questions FOR INSERT TO authenticated WITH CHECK (
    author_id = auth.uid() AND EXISTS (
        SELECT 1 FROM forums f JOIN student_subjects ss ON ss.subject_id = f.subject_id
        WHERE f.id = forum_id AND ss.student_id = auth.uid() AND f.is_active = true AND f.is_locked = false
    )
);

DROP POLICY IF EXISTS "forum_questions_update_own_or_teacher" ON forum_questions;
CREATE POLICY "forum_questions_update_own_or_teacher" ON forum_questions FOR UPDATE TO authenticated
USING (author_id = auth.uid() OR EXISTS (SELECT 1 FROM forums f JOIN subjects s ON s.id = f.subject_id WHERE f.id = forum_id AND s.teacher_id = auth.uid()))
WITH CHECK (author_id = auth.uid() OR EXISTS (SELECT 1 FROM forums f JOIN subjects s ON s.id = f.subject_id WHERE f.id = forum_id AND s.teacher_id = auth.uid()));

DROP POLICY IF EXISTS "forum_questions_delete_own_or_teacher" ON forum_questions;
CREATE POLICY "forum_questions_delete_own_or_teacher" ON forum_questions FOR DELETE TO authenticated USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM forums f JOIN subjects s ON s.id = f.subject_id WHERE f.id = forum_id AND s.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- FORUM_ANSWERS
DROP POLICY IF EXISTS "forum_answers_select_enrolled" ON forum_answers;
CREATE POLICY "forum_answers_select_enrolled" ON forum_answers FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM forum_questions fq JOIN forums f ON f.id = fq.forum_id JOIN student_subjects ss ON ss.subject_id = f.subject_id WHERE fq.id = question_id AND ss.student_id = auth.uid())
    OR EXISTS (SELECT 1 FROM forum_questions fq JOIN forums f ON f.id = fq.forum_id JOIN subjects s ON s.id = f.subject_id WHERE fq.id = question_id AND s.teacher_id = auth.uid())
    OR author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

DROP POLICY IF EXISTS "forum_answers_insert_enrolled" ON forum_answers;
CREATE POLICY "forum_answers_insert_enrolled" ON forum_answers FOR INSERT TO authenticated WITH CHECK (
    author_id = auth.uid() AND (
        EXISTS (SELECT 1 FROM forum_questions fq JOIN forums f ON f.id = fq.forum_id JOIN student_subjects ss ON ss.subject_id = f.subject_id WHERE fq.id = question_id AND ss.student_id = auth.uid() AND f.allow_student_answers = true AND fq.is_locked = false)
        OR EXISTS (SELECT 1 FROM forum_questions fq JOIN forums f ON f.id = fq.forum_id JOIN subjects s ON s.id = f.subject_id WHERE fq.id = question_id AND s.teacher_id = auth.uid())
    )
);

DROP POLICY IF EXISTS "forum_answers_update_own" ON forum_answers;
CREATE POLICY "forum_answers_update_own" ON forum_answers FOR UPDATE TO authenticated
USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "forum_answers_delete_own_or_teacher" ON forum_answers;
CREATE POLICY "forum_answers_delete_own_or_teacher" ON forum_answers FOR DELETE TO authenticated USING (
    author_id = auth.uid()
    OR EXISTS (SELECT 1 FROM forum_questions fq JOIN forums f ON f.id = fq.forum_id JOIN subjects s ON s.id = f.subject_id WHERE fq.id = question_id AND s.teacher_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

-- FORUM_ANSWER_LIKES
DROP POLICY IF EXISTS "forum_answer_likes_select_all" ON forum_answer_likes;
CREATE POLICY "forum_answer_likes_select_all" ON forum_answer_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "forum_answer_likes_insert_own" ON forum_answer_likes;
CREATE POLICY "forum_answer_likes_insert_own" ON forum_answer_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "forum_answer_likes_delete_own" ON forum_answer_likes;
CREATE POLICY "forum_answer_likes_delete_own" ON forum_answer_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT '✅ Tablas creadas:' as status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('forums', 'forum_questions', 'forum_answers', 'forum_answer_likes')
ORDER BY table_name;

SELECT '✅ Políticas RLS:' as status;
SELECT tablename, COUNT(*) as policy_count FROM pg_policies 
WHERE tablename IN ('forums', 'forum_questions', 'forum_answers', 'forum_answer_likes')
GROUP BY tablename ORDER BY tablename;

SELECT '✅ Sistema de foros instalado correctamente!' as status;
