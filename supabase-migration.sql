-- Verificar estructura actual de la tabla users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ACTUALIZAR: Hacer la columna password opcional ya que Supabase Auth maneja las contraseñas
-- Esto es más seguro porque las contraseñas no se almacenan en texto plano
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Agregar comentario para documentar el cambio
COMMENT ON COLUMN users.password IS 'Campo legacy - Supabase Auth maneja las contraseñas de forma segura';

-- Si la tabla ya existe, adaptarla a nuestras necesidades
-- Agregar columnas que falten (solo si no existen)

-- Verificar y agregar columna password si no existe (ahora opcional)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password') THEN
        ALTER TABLE users ADD COLUMN password TEXT;
    END IF;
END $$;

-- Verificar y agregar columna name si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
        ALTER TABLE users ADD COLUMN name TEXT;
    END IF;
END $$;

-- Si existe "roles" pero no "role", crear un alias o renombrar
DO $$ 
BEGIN 
    -- Si existe la columna "roles" pero no "role"
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='roles') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
        -- Agregar columna role y copiar datos de roles
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student';
        UPDATE users SET role = COALESCE(roles, 'student') WHERE role IS NULL;
    END IF;
    
    -- Si no existe ninguna columna de rol, crear role
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='roles') THEN
        ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin'));
    END IF;
END $$;

-- Agregar columna year para los estudiantes
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='year') THEN
        ALTER TABLE users ADD COLUMN year INTEGER;
        -- Solo los estudiantes necesitan tener un año asignado
        ALTER TABLE users ADD CONSTRAINT check_student_year CHECK (
            (role = 'student' AND year IS NOT NULL AND year BETWEEN 1 AND 6) OR 
            (role IN ('teacher', 'admin') AND year IS NULL)
        );
    END IF;
END $$;

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir que los usuarios vean su propia información
CREATE POLICY IF NOT EXISTS "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id::text);

-- Política para permitir la inserción de nuevos usuarios (registro)
CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (true);

-- Política para permitir actualización de datos propios
CREATE POLICY IF NOT EXISTS "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id::text);

-- Verificar estructura
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
