#!/usr/bin/env node

/**
 * 🔍 Analizador de Base de Datos Campus
 * 
 * Este script analiza automáticamente la estructura de tu base de datos de Supabase 
 * y sugiere nuevas funcionalidades basadas en las tablas y columnas existentes.
 * 
 * Uso: node analyze-database.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno faltantes');
  console.log('   Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

// Cliente de Supabase con permisos de admin
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Analiza la estructura de una tabla
 */
async function analyzeTableStructure(tableName) {
  try {
    // Obtener información de columnas desde información_schema
    const { data: columns, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);

    if (error) {
      console.log(`   ⚠️  No se pudo analizar estructura de ${tableName}:`, error.message);
      return null;
    }

    return columns;
  } catch (err) {
    console.log(`   ⚠️  Error analizando ${tableName}:`, err.message);
    return null;
  }
}

/**
 * Cuenta registros en una tabla
 */
async function countTableRecords(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ⚠️  No se pudo contar registros en ${tableName}:`, error.message);
      return 0;
    }

    return count || 0;
  } catch (err) {
    console.log(`   ⚠️  Error contando registros en ${tableName}:`, err.message);
    return 0;
  }
}

/**
 * Sugiere funcionalidades basadas en la estructura de tabla
 */
function suggestFeatures(tableName, columns, recordCount) {
  const suggestions = [];
  const columnNames = columns.map(col => col.column_name.toLowerCase());

  // Sugerencias basadas en nombre de tabla
  if (tableName.includes('user') || tableName.includes('usuario')) {
    suggestions.push('👥 Sistema de gestión de usuarios con roles y permisos');
    suggestions.push('📊 Dashboard de estadísticas de usuarios');
    suggestions.push('📧 Sistema de notificaciones por email');
  }

  if (tableName.includes('course') || tableName.includes('curso') || tableName.includes('materia')) {
    suggestions.push('📚 Gestión completa de cursos/materias');
    suggestions.push('📅 Sistema de horarios y cronogramas');
    suggestions.push('📝 Gestión de contenido de curso');
  }

  if (tableName.includes('assignment') || tableName.includes('tarea') || tableName.includes('trabajo')) {
    suggestions.push('📋 Sistema de tareas y trabajos prácticos');
    suggestions.push('⏰ Recordatorios de fechas de entrega');
    suggestions.push('📊 Calificaciones y feedback');
  }

  if (tableName.includes('grade') || tableName.includes('nota') || tableName.includes('calificacion')) {
    suggestions.push('📈 Libro de calificaciones digital');
    suggestions.push('📊 Reportes de rendimiento académico');
    suggestions.push('📧 Notificaciones de calificaciones a padres');
  }

  // Sugerencias basadas en columnas
  if (columnNames.includes('created_at') || columnNames.includes('updated_at')) {
    suggestions.push('📅 Sistema de auditoría y historial de cambios');
  }

  if (columnNames.includes('status') || columnNames.includes('estado')) {
    suggestions.push('🔄 Workflows con estados y transiciones');
  }

  if (columnNames.includes('file') || columnNames.includes('archivo') || columnNames.includes('attachment')) {
    suggestions.push('📎 Sistema de gestión de archivos y documentos');
  }

  if (columnNames.includes('email')) {
    suggestions.push('📧 Sistema de comunicación y notificaciones');
  }

  if (columnNames.includes('phone') || columnNames.includes('telefono')) {
    suggestions.push('📱 Notificaciones SMS y contacto telefónico');
  }

  // Sugerencias basadas en cantidad de registros
  if (recordCount > 100) {
    suggestions.push('🔍 Sistema de búsqueda y filtros avanzados');
    suggestions.push('📄 Paginación y carga lazy');
  }

  if (recordCount > 1000) {
    suggestions.push('📊 Analytics y reportes avanzados');
    suggestions.push('🗜️ Optimización de consultas y cache');
  }

  return [...new Set(suggestions)]; // Eliminar duplicados
}

/**
 * Función principal
 */
async function analyzeDatabaseAndSuggestFeatures() {
  console.log('🔍 Iniciando análisis de base de datos...\n');

  try {
    // Obtener lista de tablas públicas
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .neq('table_name', 'spatial_ref_sys'); // Excluir tabla del sistema

    if (error) {
      console.error('❌ Error obteniendo tablas:', error);
      return;
    }

    if (!tables || tables.length === 0) {
      console.log('⚠️  No se encontraron tablas en el esquema público');
      return;
    }

    console.log(`📋 Encontradas ${tables.length} tablas para analizar\n`);

    const allSuggestions = new Set();
    let totalRecords = 0;

    // Analizar cada tabla
    for (const table of tables) {
      const tableName = table.table_name;
      console.log(`🔍 Analizando tabla: ${tableName}`);

      // Obtener estructura
      const columns = await analyzeTableStructure(tableName);
      if (!columns) continue;

      // Contar registros
      const recordCount = await countTableRecords(tableName);
      totalRecords += recordCount;

      console.log(`   📊 ${recordCount} registros, ${columns.length} columnas`);

      // Mostrar columnas importantes
      const importantColumns = columns
        .filter(col => 
          col.column_name.includes('id') || 
          col.column_name.includes('name') || 
          col.column_name.includes('email') || 
          col.column_name.includes('status') ||
          col.column_name.includes('created_at')
        )
        .slice(0, 5);

      if (importantColumns.length > 0) {
        console.log(`   🔑 Columnas clave: ${importantColumns.map(c => c.column_name).join(', ')}`);
      }

      // Generar sugerencias
      const suggestions = suggestFeatures(tableName, columns, recordCount);
      suggestions.forEach(suggestion => allSuggestions.add(suggestion));

      console.log('');
    }

    // Mostrar resumen y sugerencias
    console.log('=' * 50);
    console.log('📊 RESUMEN DEL ANÁLISIS');
    console.log('=' * 50);
    console.log(`📋 Total de tablas analizadas: ${tables.length}`);
    console.log(`📊 Total de registros: ${totalRecords.toLocaleString()}`);
    console.log(`💡 Sugerencias generadas: ${allSuggestions.size}\n`);

    console.log('🚀 SUGERENCIAS DE FUNCIONALIDADES');
    console.log('=' * 50);

    if (allSuggestions.size === 0) {
      console.log('💭 No se generaron sugerencias específicas.');
      console.log('   Considera agregar más metadatos a tu base de datos.');
    } else {
      Array.from(allSuggestions).forEach((suggestion, index) => {
        console.log(`${index + 1}. ${suggestion}`);
      });
    }

    console.log('\n🎯 PRÓXIMOS PASOS RECOMENDADOS');
    console.log('=' * 50);
    console.log('1. 📊 Implementar dashboard con estadísticas en tiempo real');
    console.log('2. 🔐 Mejorar sistema de autenticación y autorización');
    console.log('3. 📧 Agregar sistema de notificaciones automáticas');
    console.log('4. 📱 Desarrollar interfaz móvil responsive');
    console.log('5. 🔍 Implementar búsqueda avanzada y filtros');
    console.log('6. 📈 Crear reportes y analytics detallados');
    console.log('7. 🗂️ Sistema de gestión de archivos y documentos');
    console.log('8. 🔄 Implementar workflows automatizados');

  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  }
}

// Ejecutar análisis
if (require.main === module) {
  analyzeDatabaseAndSuggestFeatures()
    .then(() => {
      console.log('\n✅ Análisis completado');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = {
  analyzeDatabaseAndSuggestFeatures,
  analyzeTableStructure,
  countTableRecords,
  suggestFeatures
};
