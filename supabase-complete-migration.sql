-- =====================================================
-- MIGRACIÓN COMPLETA DEL SISTEMA DE MATERIAS
-- Campus Virtual - Sistema Administrativo de Materias
-- =====================================================

-- 1. ACTUALIZAR TABLA USERS
-- =====================================================

SELECT 'Configurando tabla users...' as status;

-- Hacer la columna password opcional (Supabase Auth maneja las contraseñas)
DO $$ 
BEGIN 
    -- Verificar si la tabla users existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        -- Hacer password opcional si existe
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
            ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
        END IF;
    ELSE
        -- Crear tabla users si no existe
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
    END IF;
END $$;

-- Agregar columnas que falten
DO $$ 
BEGIN 
    -- Agregar name si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
        ALTER TABLE users ADD COLUMN name TEXT;
    END IF;
    
    -- Agregar role si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin'));
    END IF;
    
    -- Agregar year si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='year') THEN
        ALTER TABLE users ADD COLUMN year INTEGER;
    END IF;
    
    -- Agregar created_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Agregar updated_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Constraint para año de estudiantes
DO $$ 
BEGIN 
    -- Eliminar constraint anterior si existe
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='check_student_year' AND table_name='users') THEN
        ALTER TABLE users DROP CONSTRAINT check_student_year;
    END IF;
    
    -- Crear nuevo constraint
    ALTER TABLE users ADD CONSTRAINT check_student_year CHECK (
        (role = 'student' AND year IS NOT NULL AND year BETWEEN 1 AND 6) OR 
        (role IN ('teacher', 'admin'))
    );
END $$;

-- 2. CREAR TABLA SUBJECTS (MATERIAS)
-- =====================================================

SELECT 'Creando tabla subjects...' as status;

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

-- 3. CREAR TABLA SUBJECT_UNITS (UNIDADES DE MATERIAS)
-- =====================================================

SELECT 'Creando tabla subject_units...' as status;

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

-- 4. CREAR TABLA CALENDAR_EVENTS (EVENTOS DEL CALENDARIO)
-- =====================================================

SELECT 'Creando tabla calendar_events...' as status;

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

-- 5. CONFIGURAR ROW LEVEL SECURITY (RLS)
-- =====================================================

SELECT 'Configurando Row Level Security...' as status;

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- 6. POLÍTICAS RLS PARA USERS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Usuarios pueden ver su propia información
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins pueden ver todos los usuarios
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Permitir inserción para usuarios autenticados (registro)
CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Usuarios pueden actualizar su propia información
CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 7. POLÍTICAS RLS PARA SUBJECTS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active subjects" ON subjects;
DROP POLICY IF EXISTS "Admins can manage all subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers can view their subjects" ON subjects;

-- Todos pueden ver materias activas
CREATE POLICY "Anyone can view active subjects" ON subjects
  FOR SELECT USING (is_active = true);

-- Solo admins pueden crear, actualizar y eliminar materias
CREATE POLICY "Admins can manage all subjects" ON subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profesores pueden ver sus materias asignadas
CREATE POLICY "Teachers can view their subjects" ON subjects
  FOR SELECT USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- 8. POLÍTICAS RLS PARA SUBJECT_UNITS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view units of active subjects" ON subject_units;
DROP POLICY IF EXISTS "Admins and teachers can manage units" ON subject_units;

-- Todos pueden ver unidades de materias activas
CREATE POLICY "Anyone can view units of active subjects" ON subject_units
  FOR SELECT USING (
    is_active = true AND 
    EXISTS (
      SELECT 1 FROM subjects 
      WHERE subjects.id = subject_units.subject_id AND subjects.is_active = true
    )
  );

-- Admins y profesores pueden gestionar unidades
CREATE POLICY "Admins and teachers can manage units" ON subject_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM subjects s
      JOIN users u ON s.teacher_id = u.id
      WHERE s.id = subject_units.subject_id AND u.id = auth.uid()
    )
  );

-- 9. POLÍTICAS RLS PARA CALENDAR_EVENTS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view events of their year subjects" ON calendar_events;
DROP POLICY IF EXISTS "Teachers can manage events of their subjects" ON calendar_events;
DROP POLICY IF EXISTS "Admins can manage all events" ON calendar_events;

-- Estudiantes pueden ver eventos de materias de su año
CREATE POLICY "Users can view events of their year subjects" ON calendar_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subjects s
      JOIN users u ON u.year = s.year
      WHERE s.id = calendar_events.subject_id 
      AND u.id = auth.uid() 
      AND s.is_active = true
    ) OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Profesores pueden gestionar eventos de sus materias
CREATE POLICY "Teachers can manage events of their subjects" ON calendar_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM subjects s
      WHERE s.id = calendar_events.subject_id 
      AND s.teacher_id = auth.uid()
    )
  );

-- Admins pueden gestionar todos los eventos
CREATE POLICY "Admins can manage all events" ON calendar_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

SELECT 'Creando índices...' as status;

-- Índices para subjects
CREATE INDEX IF NOT EXISTS idx_subjects_year ON subjects(year);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(is_active);

-- Índices para subject_units
CREATE INDEX IF NOT EXISTS idx_subject_units_subject_id ON subject_units(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_units_order ON subject_units(subject_id, order_number);

-- Índices para calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_subject_id ON calendar_events(subject_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_created_by ON calendar_events(created_by);

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_year ON users(year);

-- 11. CREAR TRIGGERS PARA UPDATED_AT
-- =====================================================

SELECT 'Creando triggers...' as status;

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas las tablas
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at 
    BEFORE UPDATE ON subjects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subject_units_updated_at ON subject_units;
CREATE TRIGGER update_subject_units_updated_at 
    BEFORE UPDATE ON subject_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at 
    BEFORE UPDATE ON calendar_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 12. INSERTAR DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

SELECT 'Insertando datos de ejemplo...' as status;

-- Insertar usuario admin específico (solo si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'brunobarraud15@gmail.com') THEN
        INSERT INTO users (id, email, name, role, password, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'brunobarraud15@gmail.com',
            'Bruno Barraud',
            'admin',
            'brunobarraud15',
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- 13. VERIFICAR ESTRUCTURA FINAL
-- =====================================================

SELECT 'Verificando estructura final...' as status;

-- Mostrar todas las tablas creadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'subjects', 'subject_units', 'calendar_events')
ORDER BY table_name;

-- Mostrar columnas de subjects
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'subjects' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Migración completada exitosamente!' as status;
