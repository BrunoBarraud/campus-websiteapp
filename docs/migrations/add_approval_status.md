# Migración: Sistema de Aprobación de Estudiantes

Ejecutar este SQL en Supabase para agregar el sistema de aprobación de estudiantes.

## SQL a ejecutar

```sql
-- Agregar columna approval_status a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Agregar columna approved_by (quien aprobó al estudiante)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Agregar columna approved_at (fecha de aprobación)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Crear índice para búsquedas rápidas de estudiantes pendientes
CREATE INDEX IF NOT EXISTS idx_users_approval_status 
ON users(approval_status) 
WHERE role = 'student';

-- Actualizar estudiantes existentes como aprobados (para no romper nada)
UPDATE users 
SET approval_status = 'approved', 
    approved_at = created_at 
WHERE role = 'student' 
AND approval_status IS NULL;
```

## Notas

- Los estudiantes existentes se marcan automáticamente como `approved`
- Los nuevos estudiantes que se registren entrarán como `pending`
- Solo admin y preceptores pueden aprobar/rechazar estudiantes
- Un estudiante `pending` puede ver el campus pero no interactuar (solo lectura)
