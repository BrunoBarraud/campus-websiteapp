-- Crear tabla users para el campus virtual
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Habilitar RLS (Row Level Security) - IMPORTANTE para seguridad
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción de nuevos usuarios (registro público)
CREATE POLICY IF NOT EXISTS "Enable insert for registration" ON users
  FOR INSERT WITH CHECK (true);

-- Política para permitir que los usuarios vean su propia información
CREATE POLICY IF NOT EXISTS "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- Política para permitir actualización de datos propios
CREATE POLICY IF NOT EXISTS "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text OR auth.role() = 'service_role');

-- Verificar que la tabla se creó correctamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
