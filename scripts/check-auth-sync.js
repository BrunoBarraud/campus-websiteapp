const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Verificando usuarios en ambas tablas de Supabase...');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkBothTables() {
  try {
    console.log('\n📊 1. Usuarios en auth.users (Supabase Auth):');
    
    // Verificar usuarios autenticados
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error consultando auth.users:', authError.message);
    } else {
      console.log(`✅ Se encontraron ${authUsers.users?.length || 0} usuarios en Authentication:`);
      
      if (authUsers.users && authUsers.users.length > 0) {
        authUsers.users.forEach((user, index) => {
          console.log(`\n🔐 Usuario Auth ${index + 1}:`);
          console.log(`   • ID: ${user.id}`);
          console.log(`   • Email: ${user.email}`);
          console.log(`   • Verificado: ${user.email_confirmed_at ? '✅' : '❌'}`);
          console.log(`   • Creado: ${new Date(user.created_at).toLocaleString('es-ES')}`);
          console.log(`   • Última conexión: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('es-ES') : 'Nunca'}`);
          console.log(`   • Metadata: ${JSON.stringify(user.user_metadata)}`);
        });
      }
    }
    
    console.log('\n📊 2. Usuarios en public.users (Tabla personalizada):');
    
    // Verificar tabla personalizada
    const { data: customUsers, error: customError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (customError) {
      console.error('❌ Error consultando public.users:', customError.message);
    } else {
      console.log(`✅ Se encontraron ${customUsers?.length || 0} usuarios en tabla personalizada:`);
      
      if (customUsers && customUsers.length > 0) {
        customUsers.forEach((user, index) => {
          console.log(`\n👤 Usuario Custom ${index + 1}:`);
          console.log(`   • ID: ${user.id}`);
          console.log(`   • Email: ${user.email}`);
          console.log(`   • Nombre: ${user.name}`);
          console.log(`   • Rol: ${user.role}`);
          console.log(`   • Creado: ${new Date(user.created_at).toLocaleString('es-ES')}`);
        });
      }
    }
    
    // Comparar sincronización
    console.log('\n🔄 3. Análisis de sincronización:');
    
    if (authUsers.users && customUsers) {
      const authIds = new Set(authUsers.users.map(u => u.id));
      const customIds = new Set(customUsers.map(u => u.id));
      
      const onlyInAuth = authUsers.users.filter(u => !customIds.has(u.id));
      const onlyInCustom = customUsers.filter(u => !authIds.has(u.id));
      
      if (onlyInAuth.length > 0) {
        console.log(`⚠️  ${onlyInAuth.length} usuarios solo en Auth (necesitan sincronización):`);
        onlyInAuth.forEach(user => {
          console.log(`   • ${user.email} (${user.id})`);
        });
      }
      
      if (onlyInCustom.length > 0) {
        console.log(`⚠️  ${onlyInCustom.length} usuarios solo en tabla personalizada (huérfanos):`);
        onlyInCustom.forEach(user => {
          console.log(`   • ${user.email} (${user.id})`);
        });
      }
      
      const synced = authUsers.users.filter(u => customIds.has(u.id));
      console.log(`✅ ${synced.length} usuarios sincronizados correctamente`);
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message);
  }
}

checkBothTables();
