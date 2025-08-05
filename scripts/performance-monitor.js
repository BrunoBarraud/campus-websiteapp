// 📊 Script de monitoreo de rendimiento
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      memoryUsage: [],
      timestamp: new Date().toISOString()
    };
    this.startTime = performance.now();
  }

  // Monitorear carga de página
  trackPageLoad(pageName, duration) {
    this.metrics.pageLoads.push({
      page: pageName,
      duration: duration,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📊 Página "${pageName}" cargó en ${duration.toFixed(2)}ms`);
    
    // Alertar si es muy lento
    if (duration > 3000) {
      console.warn(`⚠️  ALERTA: Página "${pageName}" es muy lenta (${duration.toFixed(2)}ms)`);
    }
  }

  // Monitorear llamadas a API
  trackApiCall(endpoint, duration, status) {
    this.metrics.apiCalls.push({
      endpoint,
      duration,
      status,
      timestamp: new Date().toISOString()
    });
    
    console.log(`🔗 API "${endpoint}" respondió en ${duration.toFixed(2)}ms (${status})`);
    
    // Alertar si es muy lento
    if (duration > 2000) {
      console.warn(`⚠️  ALERTA: API "${endpoint}" es muy lenta (${duration.toFixed(2)}ms)`);
    }
  }

  // Monitorear uso de memoria
  trackMemoryUsage() {
    const usage = process.memoryUsage();
    const memoryData = {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024), // MB
      timestamp: new Date().toISOString()
    };
    
    this.metrics.memoryUsage.push(memoryData);
    
    console.log(`💾 Memoria: ${memoryData.heapUsed}MB usados de ${memoryData.heapTotal}MB`);
    
    // Alertar si el uso de memoria es alto
    if (memoryData.heapUsed > 512) {
      console.warn(`⚠️  ALERTA: Alto uso de memoria (${memoryData.heapUsed}MB)`);
    }
    
    return memoryData;
  }

  // Generar reporte
  generateReport() {
    const report = {
      ...this.metrics,
      summary: {
        totalRuntime: performance.now() - this.startTime,
        avgPageLoad: this.getAveragePageLoad(),
        avgApiResponse: this.getAverageApiResponse(),
        slowestPage: this.getSlowestPage(),
        slowestApi: this.getSlowestApi(),
        peakMemory: this.getPeakMemoryUsage()
      }
    };
    
    return report;
  }

  // Calcular promedio de carga de páginas
  getAveragePageLoad() {
    if (this.metrics.pageLoads.length === 0) return 0;
    const total = this.metrics.pageLoads.reduce((sum, load) => sum + load.duration, 0);
    return total / this.metrics.pageLoads.length;
  }

  // Calcular promedio de respuesta de APIs
  getAverageApiResponse() {
    if (this.metrics.apiCalls.length === 0) return 0;
    const total = this.metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0);
    return total / this.metrics.apiCalls.length;
  }

  // Encontrar página más lenta
  getSlowestPage() {
    if (this.metrics.pageLoads.length === 0) return null;
    return this.metrics.pageLoads.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );
  }

  // Encontrar API más lenta
  getSlowestApi() {
    if (this.metrics.apiCalls.length === 0) return null;
    return this.metrics.apiCalls.reduce((slowest, current) => 
      current.duration > slowest.duration ? current : slowest
    );
  }

  // Encontrar pico de memoria
  getPeakMemoryUsage() {
    if (this.metrics.memoryUsage.length === 0) return null;
    return this.metrics.memoryUsage.reduce((peak, current) => 
      current.heapUsed > peak.heapUsed ? current : peak
    );
  }

  // Guardar reporte en archivo
  saveReport(filename = 'performance-report.json') {
    const report = this.generateReport();
    const filePath = path.join(process.cwd(), 'reports', filename);
    
    // Crear directorio si no existe
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`📄 Reporte guardado en: ${filePath}`);
    
    return report;
  }

  // Mostrar resumen en consola
  showSummary() {
    const summary = this.generateReport().summary;
    
    console.log('\n📊 RESUMEN DE RENDIMIENTO');
    console.log('========================');
    console.log(`⏱️  Tiempo total: ${(summary.totalRuntime / 1000).toFixed(2)}s`);
    console.log(`📄 Promedio carga páginas: ${summary.avgPageLoad.toFixed(2)}ms`);
    console.log(`🔗 Promedio respuesta APIs: ${summary.avgApiResponse.toFixed(2)}ms`);
    
    if (summary.slowestPage) {
      console.log(`🐌 Página más lenta: ${summary.slowestPage.page} (${summary.slowestPage.duration.toFixed(2)}ms)`);
    }
    
    if (summary.slowestApi) {
      console.log(`🐌 API más lenta: ${summary.slowestApi.endpoint} (${summary.slowestApi.duration.toFixed(2)}ms)`);
    }
    
    if (summary.peakMemory) {
      console.log(`💾 Pico de memoria: ${summary.peakMemory.heapUsed}MB`);
    }
    
    console.log('========================\n');
  }
}

// Instancia global del monitor
const performanceMonitor = new PerformanceMonitor();

// Monitorear uso de memoria cada 30 segundos
setInterval(() => {
  performanceMonitor.trackMemoryUsage();
}, 30000);

// Exportar monitor
export default performanceMonitor;

// Si se ejecuta directamente, mostrar resumen cada minuto
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Monitor de rendimiento iniciado...');
  
  setInterval(() => {
    performanceMonitor.showSummary();
  }, 60000); // Cada minuto
  
  // Guardar reporte al salir
  process.on('SIGINT', () => {
    console.log('\n💾 Guardando reporte final...');
    performanceMonitor.saveReport(`performance-${Date.now()}.json`);
    process.exit(0);
  });
}
