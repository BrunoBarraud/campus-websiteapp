// Script para verificar y arreglar contraseñas en la base de datos
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixPasswords() {
  try {
    console.log('Verificando usuarios y contraseñas...');
    
    // Obtener todos los usuarios
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role, password');

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      return;
    }

    console.log('Usuarios encontrados:', users.length);
    
    for (const user of users) {
      console.log(`\nUsuario: ${user.email}`);
      console.log(`Password actual: ${user.password} (tipo: ${typeof user.password})`);
      
      if (!user.password || user.password === null) {
        // Asignar contraseña por defecto basada en el rol
        let defaultPassword;
        if (user.role === 'admin') {
          defaultPassword = 'admin123456';
        } else if (user.role === 'teacher') {
          defaultPassword = 'teacher123';
        } else if (user.role === 'student') {
          defaultPassword = 'student123';
        } else {
          defaultPassword = 'defaultpass123';
        }

        console.log(`Asignando contraseña por defecto: ${defaultPassword}`);
        
        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(defaultPassword, 12);
        
        // Actualizar en la base de datos
        const { error: updateError } = await supabase
          .from('users')
          .update({ password: hashedPassword })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Error actualizando contraseña para ${user.email}:`, updateError);
        } else {
          console.log(`✅ Contraseña actualizada para ${user.email}`);
        }
      } else {
        console.log(`✅ Usuario ${user.email} ya tiene contraseña`);
      }
    }
    
    console.log('\n🎉 Proceso completado');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixPasswords();
