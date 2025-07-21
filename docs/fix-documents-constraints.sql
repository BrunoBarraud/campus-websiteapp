-- Script para verificar y ajustar la tabla documents
-- Este script se puede copiar y pegar en el SQL Editor de Supabase

-- 1. Verificar estructura actual de documents
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Si la tabla no existe, crearla
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    file_name VARCHAR(100) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    subject_id UUID,
    unit_id UUID,
    year INTEGER,
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Modificar columnas si ya existen con restricciones muy pequeñas
DO $$ 
BEGIN 
    -- Extender title si es muy corto
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='documents' AND column_name='title' 
               AND character_maximum_length < 100) THEN
        ALTER TABLE documents ALTER COLUMN title TYPE VARCHAR(100);
        RAISE NOTICE 'Columna title extendida a 100 caracteres';
    END IF;
    
    -- Extender file_name si es muy corto
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='documents' AND column_name='file_name' 
               AND character_maximum_length < 100) THEN
        ALTER TABLE documents ALTER COLUMN file_name TYPE VARCHAR(100);
        RAISE NOTICE 'Columna file_name extendida a 100 caracteres';
    END IF;
    
    -- Verificar que file_url sea TEXT (sin límite)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='documents' AND column_name='file_url' 
               AND data_type != 'text') THEN
        ALTER TABLE documents ALTER COLUMN file_url TYPE TEXT;
        RAISE NOTICE 'Columna file_url cambiada a TEXT';
    END IF;
END $$;

-- 4. Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_documents_subject ON documents(subject_id);
CREATE INDEX IF NOT EXISTS idx_documents_unit ON documents(unit_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_year ON documents(year);

-- 5. Verificar estructura final
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'documents' 
    AND table_schema = 'public'
ORDER BY ordinal_position;
