-- 🔧 MIGRACIÓN DE UNIDADES - SIN ERRORES
-- Ejecuta este archivo completo en Supabase SQL Editor

-- PASO 1: Crear la función para triggers (obligatorio primero)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PASO 2: Crear tabla de unidades
CREATE TABLE IF NOT EXISTS public.subject_units (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID NOT NULL,
    unit_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    order_index INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 3: Crear constraint único (después de crear la tabla)
ALTER TABLE public.subject_units 
DROP CONSTRAINT IF EXISTS subject_units_subject_id_unit_number_key;

ALTER TABLE public.subject_units 
ADD CONSTRAINT subject_units_subject_id_unit_number_key 
UNIQUE(subject_id, unit_number);

-- PASO 4: Crear tabla de contenido
CREATE TABLE IF NOT EXISTS public.subject_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subject_id UUID NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    unit_id UUID,
    created_by UUID,
    is_pinned BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASO 5: Agregar constraint de tipos de contenido
ALTER TABLE public.subject_content 
DROP CONSTRAINT IF EXISTS subject_content_content_type_check;

ALTER TABLE public.subject_content 
ADD CONSTRAINT subject_content_content_type_check 
CHECK (content_type IN ('announcement', 'resource', 'assignment', 'note'));

-- PASO 6: Agregar columna unit_id a documents (si no existe)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'unit_id'
    ) THEN
        ALTER TABLE public.documents ADD COLUMN unit_id UUID;
    END IF;
END $$;

-- PASO 7: Habilitar RLS
ALTER TABLE public.subject_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_content ENABLE ROW LEVEL SECURITY;

-- PASO 8: Crear políticas simples (permitir todo a usuarios autenticados)
DROP POLICY IF EXISTS "subject_units_all" ON public.subject_units;
CREATE POLICY "subject_units_all" ON public.subject_units 
FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "subject_content_all" ON public.subject_content;
CREATE POLICY "subject_content_all" ON public.subject_content 
FOR ALL TO authenticated USING (true);

-- PASO 9: Crear triggers para actualizar updated_at
DROP TRIGGER IF EXISTS update_subject_units_updated_at ON public.subject_units;
CREATE TRIGGER update_subject_units_updated_at 
    BEFORE UPDATE ON public.subject_units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subject_content_updated_at ON public.subject_content;
CREATE TRIGGER update_subject_content_updated_at 
    BEFORE UPDATE ON public.subject_content 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PASO 10: Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_subject_units_subject_id 
ON public.subject_units(subject_id);

CREATE INDEX IF NOT EXISTS idx_subject_units_unit_number 
ON public.subject_units(subject_id, unit_number);

CREATE INDEX IF NOT EXISTS idx_subject_content_subject_id 
ON public.subject_content(subject_id);

CREATE INDEX IF NOT EXISTS idx_subject_content_unit_id 
ON public.subject_content(unit_id);

CREATE INDEX IF NOT EXISTS idx_documents_unit_id 
ON public.documents(unit_id);

-- PASO 11: Verificar que todo se creó correctamente
SELECT 
    'Tablas creadas exitosamente' as status,
    'subject_units' as table_name, 
    COUNT(*) as records 
FROM public.subject_units
UNION ALL
SELECT 
    'Tablas creadas exitosamente' as status,
    'subject_content' as table_name, 
    COUNT(*) as records 
FROM public.subject_content;

-- PASO 12: Mostrar estructura final
SELECT 
    '✅ MIGRACIÓN COMPLETADA' as resultado,
    'Las tablas subject_units y subject_content están listas' as mensaje;

-- Mostrar columnas creadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('subject_units', 'subject_content')
ORDER BY table_name, ordinal_position;
