// Script para crear un usuario de prueba para desarrollo
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://mvqkxnvetpxwjnmuaevj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cWt4bnZldHB4d2pubXVhZXZqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTM1MzkwNywiZXhwIjoyMDY2OTI5OTA3fQ.t4nz5vdGJTZJjfN14_9ILbgE1bBgIbRzRpvxxZbq8K8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('Creando usuario de prueba...');
    
    // Datos del usuario de prueba
    const testUser = {
      email: 'admin@ipdvs.edu.ar',
      password: 'admin123',
      name: 'Administrador del Sistema',
      role: 'admin',
      year: 1
    };
    
    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', testUser.email)
      .single();
    
    if (existingUser) {
      console.log('El usuario de prueba ya existe:', testUser.email);
      console.log('Puedes usar estas credenciales:');
      console.log('📧 Email:', testUser.email);
      console.log('🔑 Contraseña:', testUser.password);
      return;
    }
    
    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    
    // Crear usuario en la tabla users (usando solo las columnas que existen)
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
        year: testUser.year,
        is_active: true,
        password: hashedPassword
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creando usuario:', error);
      return;
    }
    
    console.log('✅ Usuario de prueba creado exitosamente!');
    console.log('📧 Email:', testUser.email);
    console.log('🔑 Contraseña:', testUser.password);
    console.log('👤 Rol:', testUser.role);
    console.log('');
    console.log('Test user created or already exists:', data || 'User already exists');
    console.log('Ahora puedes usar estas credenciales para hacer login y probar la responsividad.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar el script
createTestUser();