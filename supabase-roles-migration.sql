-- 📚 Sistema de Roles y Permisos para Campus Virtual
-- Actualización del esquema de base de datos

-- 1. Actualizar tabla users con roles y campos adicionales
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Crear/actualizar tabla de materias/asignaturas
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agregar columnas que podrían no existir
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS code VARCHAR(20),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS semester INTEGER,
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Agregar constraints si no existen
DO $$ 
BEGIN
    -- Agregar constraint unique para code si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subjects_code_unique' AND conrelid = 'public.subjects'::regclass
    ) THEN
        ALTER TABLE public.subjects ADD CONSTRAINT subjects_code_unique UNIQUE (code);
    END IF;
    
    -- Agregar constraint check para year si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subjects_year_check' AND conrelid = 'public.subjects'::regclass
    ) THEN
        ALTER TABLE public.subjects ADD CONSTRAINT subjects_year_check CHECK (year BETWEEN 1 AND 6);
    END IF;
    
    -- Agregar constraint check para semester si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subjects_semester_check' AND conrelid = 'public.subjects'::regclass
    ) THEN
        ALTER TABLE public.subjects ADD CONSTRAINT subjects_semester_check CHECK (semester IN (1, 2));
    END IF;
END $$;

-- 3. Crear tabla de eventos del calendario
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    time TIME,
    type VARCHAR(20) NOT NULL CHECK (type IN ('exam', 'assignment', 'class', 'holiday', 'meeting')),
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    year INTEGER, -- Para filtrar por año de estudiantes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla de documentos
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    year INTEGER, -- Para filtrar por año
    is_public BOOLEAN DEFAULT false, -- Si es público para todos los años
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Crear tabla de relación estudiante-materia (inscripciones)
CREATE TABLE IF NOT EXISTS public.student_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(student_id, subject_id)
);

-- 6. Insertar datos de ejemplo

-- Hacer a brunobarraud13@gmail.com administrador
UPDATE public.users 
SET role = 'admin', 
    bio = 'Administrador del Campus Virtual',
    updated_at = NOW()
WHERE email = 'brunobarraud13@gmail.com';

-- Insertar materias de ejemplo (solo si no existen)
INSERT INTO public.subjects (name, code, description, year, semester, credits) 
SELECT * FROM (VALUES
-- Primer Año
('Matemática I', 'MAT1', 'Álgebra y geometría básica', 1, 1, 6),
('Lengua y Literatura', 'LEN1', 'Comprensión lectora y expresión escrita', 1, 1, 4),
('Historia', 'HIS1', 'Historia universal y argentina', 1, 1, 3),
('Biología', 'BIO1', 'Introducción a la biología celular', 1, 1, 4),
('Educación Física', 'EDF1', 'Actividades físicas y deportes', 1, 1, 2),

-- Segundo Año  
('Matemática II', 'MAT2', 'Cálculo diferencial e integral', 2, 1, 6),
('Física I', 'FIS1', 'Mecánica y termodinámica', 2, 1, 5),
('Química I', 'QUI1', 'Química general e inorgánica', 2, 1, 5),
('Inglés I', 'ING1', 'Inglés básico conversacional', 2, 1, 3),
('Geografía', 'GEO1', 'Geografía física y humana', 2, 1, 3),

-- Tercer Año
('Matemática III', 'MAT3', 'Álgebra lineal y estadística', 3, 1, 6),
('Física II', 'FIS2', 'Electricidad y magnetismo', 3, 1, 5),
('Química II', 'QUI2', 'Química orgánica', 3, 1, 5),
('Inglés II', 'ING2', 'Inglés intermedio', 3, 1, 3),
('Filosofía', 'FIL1', 'Introducción al pensamiento filosófico', 3, 1, 3)
) AS new_subjects(name, code, description, year, semester, credits)
WHERE NOT EXISTS (
    SELECT 1 FROM public.subjects WHERE code = new_subjects.code
);

-- Insertar eventos de calendario de ejemplo
INSERT INTO public.calendar_events (title, description, date, type, year) VALUES
('Inicio de clases', 'Comienzo del ciclo lectivo 2025', '2025-03-01', 'holiday', NULL),
('Examen de Matemática I', 'Primer parcial de Matemática I', '2025-04-15', 'exam', 1),
('Entrega TP Biología', 'Trabajo práctico sobre células', '2025-04-20', 'assignment', 1),
('Examen de Física I', 'Primer parcial de Física I', '2025-04-25', 'exam', 2),
('Día del Trabajador', 'Feriado nacional', '2025-05-01', 'holiday', NULL),
('Semana de Mayo', 'Feriados patrios', '2025-05-25', 'holiday', NULL);

-- 7. Configurar RLS (Row Level Security)

-- Habilitar RLS en todas las tablas
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

-- Políticas para subjects
CREATE POLICY "Los administradores pueden hacer todo en subjects" ON public.subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Los profesores pueden ver y editar sus materias" ON public.subjects
    FOR ALL USING (
        teacher_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'teacher')
        )
    );

CREATE POLICY "Los estudiantes pueden ver subjects de su año" ON public.subjects
    FOR SELECT USING (
        year IN (
            SELECT users.year FROM public.users 
            WHERE users.id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'teacher')
        )
    );

-- Políticas para calendar_events
CREATE POLICY "Los administradores pueden hacer todo en calendar_events" ON public.calendar_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Los profesores pueden crear y editar eventos de sus materias" ON public.calendar_events
    FOR ALL USING (
        created_by = auth.uid() OR
        subject_id IN (
            SELECT id FROM public.subjects WHERE teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Los estudiantes pueden ver eventos de su año" ON public.calendar_events
    FOR SELECT USING (
        year IS NULL OR
        year IN (
            SELECT users.year FROM public.users 
            WHERE users.id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role IN ('admin', 'teacher')
        )
    );

-- Políticas para documents
CREATE POLICY "Los administradores pueden hacer todo en documents" ON public.documents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Los usuarios pueden ver documentos según su rol" ON public.documents
    FOR SELECT USING (
        -- Administradores ven todo
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        ) OR
        -- Profesores ven documentos de sus materias
        (
            subject_id IN (
                SELECT id FROM public.subjects WHERE teacher_id = auth.uid()
            )
        ) OR
        -- Estudiantes ven documentos de su año o públicos
        (
            is_public = true OR
            year IN (
                SELECT users.year FROM public.users 
                WHERE users.id = auth.uid()
            )
        )
    );

CREATE POLICY "Los usuarios pueden subir documentos según su rol" ON public.documents
    FOR INSERT WITH CHECK (
        uploaded_by = auth.uid() AND (
            -- Administradores pueden subir cualquier documento
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() AND users.role = 'admin'
            ) OR
            -- Profesores pueden subir a sus materias
            subject_id IN (
                SELECT id FROM public.subjects WHERE teacher_id = auth.uid()
            ) OR
            -- Estudiantes pueden subir documentos
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE users.id = auth.uid() AND users.role = 'student'
            )
        )
    );

-- 8. Crear funciones para automatizar actualizaciones
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON public.subjects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar que todo se creó correctamente
SELECT 
    'subjects' as table_name, 
    COUNT(*) as records 
FROM public.subjects
UNION ALL
SELECT 
    'calendar_events' as table_name, 
    COUNT(*) as records 
FROM public.calendar_events
UNION ALL
SELECT 
    'users' as table_name, 
    COUNT(*) as records 
FROM public.users;
