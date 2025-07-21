-- 📚 Extensión para Sistema de Unidades y Archivos por Materia
-- Ejecutar después de la migración principal

-- 0. Crear función para actualizar updated_at (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Crear tabla de unidades dentro de las materias
CREATE TABLE IF NOT EXISTS public.subject_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    unit_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(subject_id, unit_number)
);

-- 2. Actualizar tabla de documentos para incluir unidades
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.subject_units(id) ON DELETE CASCADE;

-- 3. Crear tabla para contenido adicional de materias
CREATE TABLE IF NOT EXISTS public.subject_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('announcement', 'resource', 'assignment', 'note')),
    title VARCHAR(200) NOT NULL,
    content TEXT,
    unit_id UUID REFERENCES public.subject_units(id) ON DELETE CASCADE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insertar unidades de ejemplo para las materias existentes
DO $$
BEGIN
    -- Matemática I (1er año)
    IF EXISTS (SELECT 1 FROM public.subjects WHERE code = 'MAT1') THEN
        INSERT INTO public.subject_units (subject_id, unit_number, title, description, order_index)
        SELECT s.id, 1, 'Números Reales y Operaciones', 'Introducción a los números reales, operaciones básicas y propiedades', 1
        FROM public.subjects s WHERE s.code = 'MAT1'
        ON CONFLICT (subject_id, unit_number) DO NOTHING;
        
        INSERT INTO public.subject_units (subject_id, unit_number, title, description, order_index)
        SELECT s.id, 2, 'Álgebra Básica', 'Ecuaciones lineales, sistemas de ecuaciones y polinomios', 2
        FROM public.subjects s WHERE s.code = 'MAT1'
        ON CONFLICT (subject_id, unit_number) DO NOTHING;
        
        INSERT INTO public.subject_units (subject_id, unit_number, title, description, order_index)
        SELECT s.id, 3, 'Geometría Plana', 'Figuras geométricas, perímetros, áreas y teoremas básicos', 3
        FROM public.subjects s WHERE s.code = 'MAT1'
        ON CONFLICT (subject_id, unit_number) DO NOTHING;
    END IF;

    -- Biología (1er año)
    IF EXISTS (SELECT 1 FROM public.subjects WHERE code = 'BIO1') THEN
        INSERT INTO public.subject_units (subject_id, unit_number, title, description, order_index)
        SELECT s.id, 1, 'La Célula', 'Estructura celular, tipos de células y organelas', 1
        FROM public.subjects s WHERE s.code = 'BIO1'
        ON CONFLICT (subject_id, unit_number) DO NOTHING;
        
        INSERT INTO public.subject_units (subject_id, unit_number, title, description, order_index)
        SELECT s.id, 2, 'Tejidos y Órganos', 'Organización de los seres vivos y sistemas', 2
        FROM public.subjects s WHERE s.code = 'BIO1'
        ON CONFLICT (subject_id, unit_number) DO NOTHING;
    END IF;

    -- Física I (2do año)
    IF EXISTS (SELECT 1 FROM public.subjects WHERE code = 'FIS1') THEN
        INSERT INTO public.subject_units (subject_id, unit_number, title, description, order_index)
        SELECT s.id, 1, 'Mecánica', 'Cinemática, dinámica y leyes de Newton', 1
        FROM public.subjects s WHERE s.code = 'FIS1'
        ON CONFLICT (subject_id, unit_number) DO NOTHING;
        
        INSERT INTO public.subject_units (subject_id, unit_number, title, description, order_index)
        SELECT s.id, 2, 'Termodinámica', 'Calor, temperatura y leyes termodinámicas', 2
        FROM public.subjects s WHERE s.code = 'FIS1'
        ON CONFLICT (subject_id, unit_number) DO NOTHING;
    END IF;
END $$;

-- 5. Configurar RLS para las nuevas tablas
ALTER TABLE public.subject_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_content ENABLE ROW LEVEL SECURITY;

-- Políticas para subject_units
CREATE POLICY "Administradores pueden hacer todo en subject_units" ON public.subject_units
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Profesores pueden gestionar unidades de sus materias" ON public.subject_units
    FOR ALL USING (
        subject_id IN (
            SELECT id FROM public.subjects WHERE teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Estudiantes pueden ver unidades de su año" ON public.subject_units
    FOR SELECT USING (
        subject_id IN (
            SELECT s.id FROM public.subjects s
            JOIN public.users u ON u.id = auth.uid()
            WHERE s.year = u.year OR u.role IN ('admin', 'teacher')
        )
    );

-- Políticas para subject_content
CREATE POLICY "Administradores pueden hacer todo en subject_content" ON public.subject_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Profesores pueden gestionar contenido de sus materias" ON public.subject_content
    FOR ALL USING (
        subject_id IN (
            SELECT id FROM public.subjects WHERE teacher_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

CREATE POLICY "Estudiantes pueden ver contenido de su año" ON public.subject_content
    FOR SELECT USING (
        subject_id IN (
            SELECT s.id FROM public.subjects s
            JOIN public.users u ON u.id = auth.uid()
            WHERE s.year = u.year OR u.role IN ('admin', 'teacher')
        )
    );

-- 6. Crear triggers para actualizar updated_at
CREATE TRIGGER update_subject_units_updated_at BEFORE UPDATE ON public.subject_units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subject_content_updated_at BEFORE UPDATE ON public.subject_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Crear índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_subject_units_subject_id ON public.subject_units(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_units_unit_number ON public.subject_units(subject_id, unit_number);
CREATE INDEX IF NOT EXISTS idx_subject_content_subject_id ON public.subject_content(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_content_unit_id ON public.subject_content(unit_id);
CREATE INDEX IF NOT EXISTS idx_documents_unit_id ON public.documents(unit_id);

-- 8. Verificar que todo se creó correctamente
SELECT 
    'subject_units' as table_name, 
    COUNT(*) as records 
FROM public.subject_units
UNION ALL
SELECT 
    'subject_content' as table_name, 
    COUNT(*) as records 
FROM public.subject_content;
