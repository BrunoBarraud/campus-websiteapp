const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridas');
  process.exit(1);
}

console.log('🔄 Configurando base de datos...');
console.log('📍 URL de Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'supabase-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Ejecutando migración SQL...');
    
    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      
      // Si el RPC no existe, intentemos crear la tabla directamente
      console.log('🔄 Intentando crear tabla directamente...');
      const { error: createError } = await supabase
        .from('users')
        .select('id')
        .limit(1);
        
      if (createError && createError.code === '42P01') {
        console.log('📝 Tabla users no existe, creándola...');
        
        // Crear tabla usando el SQL admin
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS users (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        `;
        
        console.log('⚠️  Nota: Para crear la tabla completamente, ejecuta este SQL en el panel de Supabase:');
        console.log(createTableSQL);
        
        // Verificar si podemos al menos conectarnos
        const { data: testData, error: testError } = await supabase
          .from('_dummy_')
          .select('*')
          .limit(1);
          
        if (testError && testError.message.includes('relation "_dummy_" does not exist')) {
          console.log('✅ Conexión a Supabase exitosa');
        } else {
          console.error('❌ Error de conexión:', testError);
          return false;
        }
      }
    } else {
      console.log('✅ Migración ejecutada exitosamente');
      console.log('📊 Datos:', data);
    }
    
    // Verificar que la tabla existe
    console.log('🔍 Verificando tabla users...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.log('⚠️  Tabla users no existe o no es accesible');
      console.log('📝 Error:', tableError.message);
      
      if (tableError.code === '42P01') {
        console.log('\n🔧 Para solucionar este problema:');
        console.log('1. Ve al panel de Supabase: https://supabase.com/dashboard');
        console.log('2. Selecciona tu proyecto: mvqkxnvetpxwjnmuaevj');
        console.log('3. Ve a "SQL Editor"');
        console.log('4. Ejecuta el siguiente SQL:');
        console.log('\n```sql');
        console.log(fs.readFileSync(migrationPath, 'utf8'));
        console.log('```\n');
      }
      
      return false;
    } else {
      console.log('✅ Tabla users existe y es accesible');
      return true;
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
    return false;
  }
}

// Ejecutar la configuración
setupDatabase().then(success => {
  if (success) {
    console.log('🎉 Base de datos configurada correctamente');
    process.exit(0);
  } else {
    console.log('❌ Configuración de base de datos incompleta');
    process.exit(1);
  }
});
