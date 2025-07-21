const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Monitor de estado de Supabase');
console.log('📍 URL:', supabaseUrl);
console.log('⏰ Iniciando monitoreo cada 30 segundos...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

let consecutiveErrors = 0;
let lastSuccessTime = null;

async function checkSupabaseStatus() {
  const timestamp = new Date().toLocaleString('es-ES');
  
  try {
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      consecutiveErrors++;
      console.log(`❌ [${timestamp}] Error: ${error.message} (Errores consecutivos: ${consecutiveErrors})`);
      
      if (error.code === '42P01') {
        console.log('💡 Sugerencia: La tabla "users" no existe. Ejecuta la migración SQL.');
      }
    } else {
      if (consecutiveErrors > 0) {
        console.log(`✅ [${timestamp}] ¡Servicio restaurado! (Tiempo de respuesta: ${responseTime}ms)`);
      } else {
        console.log(`✅ [${timestamp}] Servicio funcionando correctamente (${responseTime}ms)`);
      }
      consecutiveErrors = 0;
      lastSuccessTime = timestamp;
    }
  } catch (err) {
    consecutiveErrors++;
    console.log(`💥 [${timestamp}] Error de conexión: ${err.message} (Errores consecutivos: ${consecutiveErrors})`);
    
    if (err.message.includes('fetch failed')) {
      console.log('💡 Posibles causas: Red no disponible, servidor pausado, o problemas de infraestructura');
    }
    
    if (err.message.includes('521')) {
      console.log('🌐 Error 521 detectado: El servidor web está caído (Cloudflare/Supabase)');
      console.log('⏳ Esto suele resolverse automáticamente en unos minutos');
    }
  }
  
  // Mostrar resumen cada 10 errores consecutivos
  if (consecutiveErrors > 0 && consecutiveErrors % 10 === 0) {
    console.log(`\n📊 RESUMEN:`);
    console.log(`   • Errores consecutivos: ${consecutiveErrors}`);
    console.log(`   • Último éxito: ${lastSuccessTime || 'Nunca'}`);
    console.log(`   • Estado: ${consecutiveErrors > 5 ? 'CRÍTICO' : 'INESTABLE'}\n`);
  }
}

// Verificación inicial
checkSupabaseStatus();

// Monitoreo continuo cada 30 segundos
setInterval(checkSupabaseStatus, 30000);

// Manejar interrupción del script
process.on('SIGINT', () => {
  console.log('\n👋 Monitor detenido por el usuario');
  console.log(`📊 Resumen final:`);
  console.log(`   • Total de errores consecutivos: ${consecutiveErrors}`);
  console.log(`   • Último éxito: ${lastSuccessTime || 'Nunca'}`);
  process.exit(0);
});
