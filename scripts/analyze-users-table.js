const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('🔍 Analizando estructura actual de la tabla users...');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeTable() {
  try {
    // Obtener estructura de la tabla
    console.log('📋 Estructura de la tabla users:');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns_info', { 
        table_name: 'users',
        schema_name: 'public'
      });
    
    if (columnsError) {
      // Método alternativo si el RPC no existe
      console.log('⚠️  Usando método alternativo para obtener estructura...');
      
      // Intentar hacer una consulta SELECT para ver qué columnas existen
      const { data: sampleData, error: selectError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.log('❌ Error consultando tabla:', selectError.message);
        console.log('💡 Código de error:', selectError.code);
        
        if (selectError.code === '42P01') {
          console.log('🔧 La tabla "users" no existe. Creándola...');
          // Aquí podríamos crear la tabla
        }
      } else {
        console.log('✅ Tabla existe, estructura detectada:');
        if (sampleData && sampleData.length > 0) {
          const columns = Object.keys(sampleData[0]);
          columns.forEach(col => {
            console.log(`   • ${col}: ${typeof sampleData[0][col]}`);
          });
        } else {
          console.log('   📝 Tabla vacía, intentando inserción de prueba...');
          
          // Probar inserción para determinar estructura requerida
          const testUser = {
            email: `test-${Date.now()}@example.com`,
            name: 'Usuario Test',
            password: 'hashedpassword123'
          };
          
          const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert([testUser])
            .select()
            .single();
          
          if (insertError) {
            console.log('❌ Error en inserción de prueba:', insertError.message);
            console.log('💡 Esto nos dice qué columnas faltan o están mal configuradas');
            
            // Analizar el error para determinar qué columnas faltan
            if (insertError.message.includes('null value in column')) {
              console.log('🔧 Hay columnas requeridas que no estamos proporcionando');
            }
            if (insertError.message.includes('does not exist')) {
              console.log('🔧 Alguna columna que intentamos usar no existe');
            }
          } else {
            console.log('✅ Inserción exitosa!');
            console.log('📊 Datos insertados:', insertData);
            
            // Limpiar el usuario de prueba
            await supabase
              .from('users')
              .delete()
              .eq('id', insertData.id);
            console.log('🧹 Usuario de prueba eliminado');
          }
        }
      }
    } else {
      console.log('✅ Estructura obtenida:');
      columns.forEach(col => {
        console.log(`   • ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
      });
    }
    
    // Verificar usuarios existentes
    console.log('\n👥 Usuarios existentes:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      console.log('❌ Error consultando usuarios:', usersError.message);
    } else {
      console.log(`📊 Total de usuarios encontrados: ${users?.length || 0}`);
      if (users && users.length > 0) {
        users.forEach((user, i) => {
          console.log(`   ${i + 1}. ${user.email || user.name || user.id}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error.message);
  }
}

analyzeTable();
