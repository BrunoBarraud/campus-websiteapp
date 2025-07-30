-- 🛠️ INSTRUCCIONES PARA AGREGAR SOPORTE DE ARCHIVOS
-- Ejecuta este SQL en tu Supabase Dashboard -> SQL Editor

-- 1. Agregar columnas para archivos adjuntos en tareas
ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 2. Agregar columnas para archivos en entregas de estudiantes  
ALTER TABLE assignment_submissions
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name TEXT;

-- 3. Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assignments'
AND column_name IN ('file_url', 'file_name');

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'assignment_submissions'
AND column_name IN ('file_url', 'file_name');

-- 4. (Opcional) Agregar comentarios para documentar
COMMENT ON COLUMN assignments.file_url IS 'URL del archivo adjunto de la tarea';
COMMENT ON COLUMN assignments.file_name IS 'Nombre original del archivo adjunto';
COMMENT ON COLUMN assignment_submissions.file_url IS 'URL del archivo de entrega del estudiante';
COMMENT ON COLUMN assignment_submissions.file_name IS 'Nombre original del archivo de entrega';
