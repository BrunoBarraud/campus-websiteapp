-- =====================================================
-- MIGRACIÓN SIMPLIFICADA - PASO A PASO
-- Campus Virtual - Sistema de Materias
-- =====================================================

-- PASO 1: Verificar y actualizar tabla users
-- =====================================================

-- Verificar si existe la tabla users
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public')
        THEN 'La tabla users ya existe'
        ELSE 'La tabla users NO existe - se creará'
    END as resultado;

-- Si la tabla users no existe, ejecutar esto:
/*
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    year INTEGER,
    password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
*/

-- Agregar columnas que falten (ejecutar siempre)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';
ALTER TABLE users ADD COLUMN IF NOT EXISTS year INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Agregar constraint de rol si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%role%' 
        AND table_name = 'users' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT check_user_role CHECK (role IN ('student', 'teacher', 'admin'));
    END IF;
END $$;

-- Agregar constraint de año para estudiantes
DO $$
BEGIN
    -- Eliminar constraint anterior si existe
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_student_year' AND table_name = 'users'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT check_student_year;
    END IF;
    
    -- Crear nuevo constraint
    ALTER TABLE users ADD CONSTRAINT check_student_year CHECK (
        (role = 'student' AND year IS NOT NULL AND year BETWEEN 1 AND 6) OR 
        (role IN ('teacher', 'admin'))
    );
END $$;

-- PASO 2: Crear tabla subjects
-- =====================================================

DROP TABLE IF EXISTS subjects CASCADE;

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    year INTEGER NOT NULL CHECK (year BETWEEN 1 AND 6),
    image_url TEXT DEFAULT '/images/subjects/default.jpg',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 3: Crear tabla subject_units
-- =====================================================

DROP TABLE IF EXISTS subject_units CASCADE;

CREATE TABLE subject_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_number INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subject_id, order_number)
);

-- PASO 4: Crear tabla calendar_events
-- =====================================================

DROP TABLE IF EXISTS calendar_events CASCADE;

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('class', 'exam', 'assignment', 'project', 'other')),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 5: Habilitar RLS
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- PASO 6: Crear políticas RLS básicas
-- =====================================================

-- Políticas para users
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Políticas para subjects
DROP POLICY IF EXISTS "Anyone can view active subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage all subjects" ON subjects;

CREATE POLICY "Anyone can view active subjects" ON subjects
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all subjects" ON subjects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- PASO 7: Crear índices
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_subjects_year ON subjects(year);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_subject_units_subject_id ON subject_units(subject_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_subject_id ON calendar_events(subject_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_year ON users(year);

-- PASO 8: Crear triggers
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
DROP TRIGGER IF EXISTS update_subject_units_updated_at ON subject_units;
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_units_updated_at 
    BEFORE UPDATE ON subject_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PASO 9: Verificación final
-- =====================================================

SELECT 'Migración completada exitosamente!' as resultado;

-- Verificar tablas creadas
SELECT 
    table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as columnas
FROM information_schema.tables t
WHERE table_schema = 'public' 
AND table_name IN ('users', 'subjects', 'subject_units', 'calendar_events')
ORDER BY table_name;
