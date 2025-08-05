#!/usr/bin/env node

/**
 * 🔍 Script para verificar los tipos de contenido permitidos en la base de datos
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkContentTypes() {
  console.log('🔍 Verificando restricciones de content_type...\n');

  try {
    // 1. Intentar obtener la información de la restricción
    const { data: constraints, error: constraintError } = await supabase
      .rpc('get_table_constraints', { table_name: 'subject_content' })
      .single();

    if (constraintError) {
      console.log('⚠️ No se pudo obtener restricciones directamente:', constraintError.message);
    } else if (constraints) {
      console.log('📋 Restricciones encontradas:', constraints);
    }

    // 2. Intentar insertar diferentes tipos para ver cuáles fallan
    console.log('\n🧪 Probando diferentes tipos de contenido...\n');

    const testTypes = [
      'content',
      'document', 
      'assignment',
      'text',
      'video',
      'link',
      'file'
    ];

    for (const type of testTypes) {
      try {
        const testInsert = {
          subject_id: '00000000-0000-0000-0000-000000000000', // ID falso para prueba
          unit_id: '00000000-0000-0000-0000-000000000000',
          content_type: type,
          title: `Test ${type}`,
          content: 'Test content',
          created_by: '00000000-0000-0000-0000-000000000000',
          is_active: true
        };

        const { error } = await supabase
          .from('subject_content')
          .insert([testInsert]);

        if (error) {
          if (error.code === '23514') {
            console.log(`❌ "${type}" - NO permitido (check constraint)`);
          } else if (error.code === '23503') {
            console.log(`✅ "${type}" - Permitido (falla por FK, pero tipo válido)`);
          } else {
            console.log(`⚠️ "${type}" - Error diferente:`, error.message);
          }
        } else {
          console.log(`✅ "${type}" - Permitido`);
        }
      } catch (err) {
        console.log(`❌ "${type}" - Error inesperado:`, err.message);
      }
    }

    // 3. Verificar registros existentes para ver qué tipos se están usando
    console.log('\n📊 Tipos de contenido existentes en la base de datos:\n');
    
    const { data: existingTypes, error: typesError } = await supabase
      .from('subject_content')
      .select('content_type')
      .limit(100);

    if (typesError) {
      console.log('❌ Error obteniendo tipos existentes:', typesError.message);
    } else if (existingTypes && existingTypes.length > 0) {
      const typeCount = existingTypes.reduce((acc, item) => {
        acc[item.content_type] = (acc[item.content_type] || 0) + 1;
        return acc;
      }, {});

      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`  📄 "${type}": ${count} registros`);
      });
    } else {
      console.log('📝 No hay registros existentes en subject_content');
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

checkContentTypes().then(() => {
  console.log('\n✅ Verificación completada');
  process.exit(0);
});
