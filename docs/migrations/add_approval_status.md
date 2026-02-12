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
- Solo admin y admin_director pueden aprobar/rechazar estudiantes
- Un estudiante `pending` puede ver el campus pero no interactuar (solo lectura)

---

# Migración: Rol admin_director

El rol `admin_director` es para la directora del colegio. Tiene permisos para:
- Aprobar/rechazar estudiantes de cualquier año
- Ver sus materias asignadas (como profesor)
- No puede gestionar materias ni asignar profesores

## SQL para agregar el rol admin_director

```sql
-- Primero actualizar el constraint de roles
ALTER TABLE users DROP CONSTRAINT users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('admin', 'admin_director', 'teacher', 'student'));
```

## SQL para asignar el rol a un usuario existente

```sql
-- Cambiar el rol de un profesor a admin_director
UPDATE users 
SET role = 'admin_director' 
WHERE email = 'email_de_la_directora@ejemplo.com';
```

## Notas sobre admin_director

- El rol `admin_director` es independiente de `teacher`
- Si la directora también es profesora, su rol será `admin_director` y verá sus materias asignadas
- Tiene acceso a "Estudiantes Pendientes" en el sidebar
