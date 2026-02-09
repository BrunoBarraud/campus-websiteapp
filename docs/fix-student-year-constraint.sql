-- Script para modificar el constraint check_student_year
-- Este constraint impide crear estudiantes sin año asignado
-- Lo modificamos para permitir year NULL temporalmente (hasta que seleccionen su año)

-- Eliminar el constraint existente
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_student_year;

-- Crear nuevo constraint que permite year NULL para estudiantes
-- (necesario para Google OAuth donde seleccionan el año después)
ALTER TABLE users ADD CONSTRAINT check_student_year 
CHECK (
  role != 'student' OR year IS NULL OR (year >= 1 AND year <= 6)
);

-- Verificar que el constraint se aplicó correctamente
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'check_student_year';
