-- Agregar columna password a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Agregar columna name si no existe
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Verificar estructura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
