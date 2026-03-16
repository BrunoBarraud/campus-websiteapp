-- ============================================================================
-- MIGRACIÓN MULTI-SEDE - CAMPUS VIRTUAL
-- ============================================================================

-- 1. Crear tabla de sedes (Schools)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    primary_color TEXT,
    secondary_color TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en schools
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Schools son visibles por todos los usuarios autenticados" 
ON public.schools FOR SELECT TO authenticated USING (true);

-- 2. Insertar sedes iniciales
-- Guardamos los IDs para el backfill posterior
INSERT INTO public.schools (name, subdomain, primary_color, secondary_color, logo_url)
VALUES 
('Instituto Privado Dalmacio Vélez Sarsfield', 'velez', '#f59e0b', '#fbbf24', '/images/logo-velez.png'),
('Instituto Privado San José', 'sanjose', '#0056b3', '#ffcc00', '/images/logo-sanjose.jpg'),
('Instituto Privado Virgen Niña', 'virgennina', '#4f46e5', '#818cf8', '/images/logo-virgennina.png')
ON CONFLICT (subdomain) DO NOTHING;

-- 3. Agregar school_id a todas las tablas relacionales
-- Nota: Lo agregamos como nullable primero para permitir el backfill

-- Usuarios
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Materias
ALTER TABLE public.subjects ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Eventos de Calendario (Incluso los globales deben pertenecer a una sede)
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Documentos generales
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Foros
ALTER TABLE public.forums ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- 4. BACKFILL: Asignar todo el contenido actual al Vélez Sarsfield
DO $$
DECLARE
    velez_id UUID;
BEGIN
    SELECT id INTO velez_id FROM public.schools WHERE subdomain = 'velez' LIMIT 1;
    
    IF velez_id IS NOT NULL THEN
        UPDATE public.users SET school_id = velez_id WHERE school_id IS NULL;
        UPDATE public.subjects SET school_id = velez_id WHERE school_id IS NULL;
        UPDATE public.calendar_events SET school_id = velez_id WHERE school_id IS NULL;
        UPDATE public.documents SET school_id = velez_id WHERE school_id IS NULL;
        UPDATE public.forums SET school_id = velez_id WHERE school_id IS NULL;
    END IF;
END $$;

-- 5. Hacer que school_id sea NOT NULL ahora que hay datos
-- Primero verificamos que no haya nulos residuales
ALTER TABLE public.users ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.subjects ALTER COLUMN school_id SET NOT NULL;
ALTER TABLE public.calendar_events ALTER COLUMN school_id SET NOT NULL;

-- 6. Indices de performance
CREATE INDEX IF NOT EXISTS idx_users_school ON public.users(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school ON public.subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_calendar_school ON public.calendar_events(school_id);

-- 7. Actualizar políticas RLS para aislamiento
-- Estas políticas aseguran que un usuario de la Sede A no vea datos de la Sede B

-- Ejemplo de aislamiento para la tabla de perfiles (users)
DROP POLICY IF EXISTS "Aislamiento por sede para perfiles" ON public.users;
CREATE POLICY "Aislamiento por sede para perfiles" ON public.users
FOR SELECT TO authenticated
USING (
    school_id = (SELECT u.school_id FROM public.users u WHERE u.id = auth.uid())
);

-- Ejemplo de aislamiento para las materias (subjects)
DROP POLICY IF EXISTS "Aislamiento por sede para materias" ON public.subjects;
CREATE POLICY "Aislamiento por sede para materias" ON public.subjects
FOR SELECT TO authenticated
USING (
    school_id = (SELECT u.school_id FROM public.users u WHERE u.id = auth.uid())
);

-- ============================================================================
