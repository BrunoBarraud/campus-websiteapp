const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Verificando usuarios en Supabase...');
console.log('📍 URL:', supabaseUrl);
console.log('🔑 Service Key disponible:', !!supabaseServiceKey);
console.log('🔑 Anon Key disponible:', !!supabaseAnonKey);

// Usar la service key para acceso completo
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  try {
    console.log('\n📊 Consultando tabla users...');
    
    // Obtener todos los usuarios
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error al consultar usuarios:', error);
      return;
    }
    
    console.log(`✅ Se encontraron ${users?.length || 0} usuarios en la base de datos:`);
    
    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`\n👤 Usuario ${index + 1}:`);
        console.log(`   • ID: ${user.id}`);
        console.log(`   • Email: ${user.email}`);
        console.log(`   • Nombre: ${user.name}`);
        console.log(`   • Rol: ${user.role}`);
        console.log(`   • Creado: ${new Date(user.created_at).toLocaleString('es-ES')}`);
      });
    } else {
      console.log('⚠️  No se encontraron usuarios en la base de datos');
      console.log('\n🔍 Posibles causas:');
      console.log('   1. Los usuarios se están guardando en una tabla diferente');
      console.log('   2. El cliente está usando datos mock en lugar de la BD real');
      console.log('   3. Problemas de permisos en Supabase');
    }
    
    // Verificar estructura de la tabla
    console.log('\n📋 Verificando estructura de la tabla...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
      .single();
      
    if (tableError) {
      console.log('⚠️  No se pudo obtener información de la tabla (es normal)');
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message);
  }
}

checkUsers();
