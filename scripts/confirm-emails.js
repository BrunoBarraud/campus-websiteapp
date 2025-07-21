const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('📧 Script para confirmar emails automáticamente (SOLO DESARROLLO)');

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function confirmAllUsers() {
  try {
    console.log('🔍 Obteniendo usuarios no confirmados...');
    
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error obteniendo usuarios:', error.message);
      return;
    }
    
    const unconfirmedUsers = users.users.filter(user => !user.email_confirmed_at);
    
    console.log(`📊 Encontrados ${unconfirmedUsers.length} usuarios sin confirmar`);
    
    for (const user of unconfirmedUsers) {
      console.log(`📧 Confirmando email para: ${user.email}`);
      
      const { data, error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { 
          email_confirm: true,
          app_metadata: { ...user.app_metadata },
          user_metadata: { ...user.user_metadata }
        }
      );
      
      if (confirmError) {
        console.error(`❌ Error confirmando ${user.email}:`, confirmError.message);
      } else {
        console.log(`✅ Email confirmado para: ${user.email}`);
      }
    }
    
    console.log('\n🎉 Proceso completado');
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message);
  }
}

confirmAllUsers();
