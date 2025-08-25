import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = 'https://mvqkxnvetpxwjnmuaevj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cWt4bnZldHB4d2pubXVhZXZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM1MzkwNywiZXhwIjoyMDY2OTI5OTA3fQ.t4nz5vdGJTZJjfN14_9ILbgE1bBgIbRzRpvxxZbq8K8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPassword() {
  try {
    console.log('Verificando contraseña del usuario de prueba...');
    
    // Obtener el usuario de la base de datos
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@ipdvs.edu.ar')
      .single();

    if (error || !user) {
      console.error('❌ Usuario no encontrado:', error);
      return;
    }

    console.log('✅ Usuario encontrado:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      password_hash: user.password ? user.password.substring(0, 20) + '...' : 'No password'
    });

    // Verificar la contraseña
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, user.password);
    
    console.log('🔑 Verificación de contraseña:');
    console.log('   Contraseña de prueba:', testPassword);
    console.log('   Hash almacenado:', user.password ? user.password.substring(0, 30) + '...' : 'No hash');
    console.log('   ¿Coincide?:', isValid ? '✅ SÍ' : '❌ NO');
    
    if (!isValid) {
      console.log('\n🔧 Actualizando contraseña...');
      const newHash = await bcrypt.hash(testPassword, 12);
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newHash })
        .eq('email', 'admin@ipdvs.edu.ar');
        
      if (updateError) {
        console.error('❌ Error al actualizar contraseña:', updateError);
      } else {
        console.log('✅ Contraseña actualizada correctamente');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyPassword();