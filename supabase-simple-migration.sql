-- 🔧 MIGRACIÓN SIMPLE - Solo agregar campos necesarios
-- Usar esta versión si ya tienes tablas existentes

-- 1. Actualizar tabla users con roles y campos adicionales
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student',
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Agregar constraint de roles si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_role_check' AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'teacher', 'student'));
    END IF;
END $$;

-- 2. Hacer a brunobarraud13@gmail.com administrador
UPDATE public.users 
SET role = 'admin', 
    bio = 'Administrador del Campus Virtual',
    updated_at = NOW()
WHERE email = 'brunobarraud13@gmail.com';

-- 3. Crear tabla subjects si no existe, o actualizar la existente
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar todas las columnas que necesitamos
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS code VARCHAR(20),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS semester INTEGER,
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS teacher_id UUID,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Crear tabla calendar_events
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME,
    type VARCHAR(20) NOT NULL,
    subject_id UUID,
    created_by UUID,
    year INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    subject_id UUID,
    uploaded_by UUID,
    year INTEGER,
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Insertar datos de ejemplo
-- Solo insertar si no existen materias
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.subjects LIMIT 1) THEN
        INSERT INTO public.subjects (name, code, description, year, semester, credits) VALUES
        ('Matemática I', 'MAT1', 'Álgebra y geometría básica', 1, 1, 6),
        ('Lengua y Literatura', 'LEN1', 'Comprensión lectora y expresión escrita', 1, 1, 4),
        ('Historia', 'HIS1', 'Historia universal y argentina', 1, 1, 3),
        ('Biología', 'BIO1', 'Introducción a la biología celular', 1, 1, 4),
        ('Educación Física', 'EDF1', 'Actividades físicas y deportes', 1, 1, 2),
        ('Matemática II', 'MAT2', 'Cálculo diferencial e integral', 2, 1, 6),
        ('Física I', 'FIS1', 'Mecánica y termodinámica', 2, 1, 5),
        ('Química I', 'QUI1', 'Química general e inorgánica', 2, 1, 5),
        ('Inglés I', 'ING1', 'Inglés básico conversacional', 2, 1, 3),
        ('Geografía', 'GEO1', 'Geografía física y humana', 2, 1, 3);
    END IF;
END $$;

-- Insertar eventos de ejemplo si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.calendar_events LIMIT 1) THEN
        INSERT INTO public.calendar_events (title, description, date, type, year) VALUES
        ('Inicio de clases', 'Comienzo del ciclo lectivo 2025', '2025-03-01', 'holiday', NULL),
        ('Examen de Matemática I', 'Primer parcial de Matemática I', '2025-04-15', 'exam', 1),
        ('Entrega TP Biología', 'Trabajo práctico sobre células', '2025-04-20', 'assignment', 1),
        ('Examen de Física I', 'Primer parcial de Física I', '2025-04-25', 'exam', 2),
        ('Día del Trabajador', 'Feriado nacional', '2025-05-01', 'holiday', NULL);
    END IF;
END $$;

-- 7. Habilitar RLS y crear políticas básicas
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Políticas simples para empezar
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.subjects;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.calendar_events;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.documents;

CREATE POLICY "Enable all for authenticated users" ON public.subjects
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all for authenticated users" ON public.calendar_events
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable all for authenticated users" ON public.documents
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 8. Verificar que todo funcionó
SELECT 
    'users' as table_name, 
    COUNT(*) as records,
    'role column added' as status
FROM public.users
WHERE role IS NOT NULL
UNION ALL
SELECT 
    'subjects' as table_name, 
    COUNT(*) as records,
    'table ready' as status
FROM public.subjects
UNION ALL
SELECT 
    'calendar_events' as table_name, 
    COUNT(*) as records,
    'table ready' as status
FROM public.calendar_events;
