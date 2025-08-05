// 🚀 Hook para monitoreo de rendimiento en el frontend
import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  componentRenderTime: number;
  apiResponseTime: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
}

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(performance.now());
  const metricsRef = useRef<Partial<PerformanceMetrics>>({});

  // Monitorear tiempo de renderizado del componente
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    metricsRef.current.componentRenderTime = renderTime;
    
    if (renderTime > 100) {
      console.warn(`⚠️ Componente "${componentName}" tardó ${renderTime.toFixed(2)}ms en renderizar`);
    }
  }, [componentName]);

  // Monitorear Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        metricsRef.current.largestContentfulPaint = lastEntry.startTime;
        
        if (lastEntry.startTime > 2500) {
          console.warn(`⚠️ LCP lento: ${lastEntry.startTime.toFixed(2)}ms`);
        }
      });
      
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch {
        console.warn('LCP observer no soportado');
      }
    };

    // First Input Delay (FID)
    const observeFID = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart && entry.startTime) {
            const fid = entry.processingStart - entry.startTime;
            metricsRef.current.firstInputDelay = fid;
            
            if (fid > 100) {
              console.warn(`⚠️ FID alto: ${fid.toFixed(2)}ms`);
            }
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['first-input'] });
      } catch {
        console.warn('FID observer no soportado');
      }
    };

    // Cumulative Layout Shift (CLS)
    const observeCLS = () => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput && entry.value) {
            clsValue += entry.value;
            metricsRef.current.cumulativeLayoutShift = clsValue;
            
            if (clsValue > 0.1) {
              console.warn(`⚠️ CLS alto: ${clsValue.toFixed(4)}`);
            }
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch {
        console.warn('CLS observer no soportado');
      }
    };

    observeLCP();
    observeFID();
    observeCLS();
  }, []);

  // Función para medir tiempo de API
  const measureApiCall = useCallback(async (
    apiCall: () => Promise<any>,
    endpoint: string
  ) => {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      metricsRef.current.apiResponseTime = duration;
      
      if (duration > 1000) {
        console.warn(`⚠️ API "${endpoint}" lenta: ${duration.toFixed(2)}ms`);
      } else {
        console.log(`✅ API "${endpoint}": ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.error(`❌ Error en API "${endpoint}" después de ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }, []);

  // Función para reportar métricas personalizadas
  const reportMetric = useCallback((name: string, value: number, unit = 'ms') => {
    console.log(`📊 ${componentName} - ${name}: ${value.toFixed(2)}${unit}`);
    
    // Enviar a servicio de analytics si está configurado
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'custom_metric', {
        custom_parameter: value,
        event_category: 'Performance',
        event_label: `${componentName}_${name}`,
        value: Math.round(value)
      });
    }
  }, [componentName]);

  // Obtener todas las métricas
  const getMetrics = useCallback(() => {
    return { ...metricsRef.current };
  }, []);

  // Función para benchmark de operaciones
  const benchmark = useCallback(<T,>(
    operation: () => T,
    operationName: string
  ): T => {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    reportMetric(operationName, duration);
    return result;
  }, [reportMetric]);

  return {
    measureApiCall,
    reportMetric,
    getMetrics,
    benchmark
  };
};

// Función para medir tiempo hasta interactividad
export const measureTimeToInteractive = (callback?: (tti: number) => void) => {
  if (typeof window === 'undefined') return;
  
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const navigation = entries.find(entry => entry.entryType === 'navigation') as PerformanceNavigationTiming;
    
    if (navigation && navigation.domInteractive) {
      const tti = navigation.domInteractive - navigation.fetchStart;
      console.log(`⚡ Time to Interactive: ${tti.toFixed(2)}ms`);
      
      if (callback) {
        callback(tti);
      }
      
      if (tti > 3500) {
        console.warn(`⚠️ TTI muy alto: ${tti.toFixed(2)}ms`);
      }
    }
  });
  
  try {
    observer.observe({ entryTypes: ['navigation'] });
  } catch {
    console.warn('Navigation timing no soportado');
  }
};

// Función para optimización automática de imágenes
export const optimizeImageLoading = () => {
  if (typeof window === 'undefined') return;
  
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const loadStart = performance.now();
        
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.onload = () => {
            const loadTime = performance.now() - loadStart;
            console.log(`🖼️ Imagen cargada en ${loadTime.toFixed(2)}ms`);
            img.classList.add('loaded');
          };
        }
        
        observer.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
};
