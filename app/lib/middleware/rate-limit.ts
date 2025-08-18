/**
 * Middleware para limitar la tasa de solicitudes (rate limiting)
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  // Número máximo de solicitudes permitidas en el período
  maxRequests: number;
  // Período de tiempo en segundos
  windowSizeInSeconds: number;
  // Mensaje de error personalizado (opcional)
  message?: string;
}

// Almacenamiento en memoria para las solicitudes (en producción usar Redis u otra solución distribuida)
const ipRequestMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Limpia periódicamente el mapa de IPs para evitar fugas de memoria
 */
const cleanupInterval = 60 * 1000; // 1 minuto
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequestMap.entries()) {
    if (data.resetTime <= now) {
      ipRequestMap.delete(ip);
    }
  }
}, cleanupInterval);

/**
 * Middleware para limitar la tasa de solicitudes por IP
 * @param req Solicitud entrante
 * @param config Configuración del límite de tasa
 * @returns Respuesta HTTP
 */
export function rateLimitMiddleware(
  req: NextRequest,
  config: RateLimitConfig = { maxRequests: 100, windowSizeInSeconds: 60 }
): NextResponse {
  // Obtener la IP del cliente
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
  
  // Obtener la hora actual
  const now = Date.now();
  
  // Obtener o crear el registro para esta IP
  let ipData = ipRequestMap.get(ip);
  
  if (!ipData || ipData.resetTime <= now) {
    // Si no hay registro o ya expiró, crear uno nuevo
    ipData = {
      count: 0,
      resetTime: now + (config.windowSizeInSeconds * 1000),
    };
    ipRequestMap.set(ip, ipData);
  }
  
  // Incrementar el contador de solicitudes
  ipData.count++;
  
  // Verificar si se ha excedido el límite
  if (ipData.count > config.maxRequests) {
    // Calcular el tiempo restante hasta el reinicio
    const retryAfter = Math.ceil((ipData.resetTime - now) / 1000);
    
    // Devolver respuesta 429 Too Many Requests
    return new NextResponse(
      JSON.stringify({
        error: config.message || 'Too many requests, please try again later.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
        },
      }
    );
  }
  
  // Permitir la solicitud
  return NextResponse.next();
}

/**
 * Middleware específico para limitar intentos de inicio de sesión
 * Más restrictivo para proteger contra ataques de fuerza bruta
 */
export function loginRateLimitMiddleware(req: NextRequest): NextResponse {
  return rateLimitMiddleware(req, {
    maxRequests: 5,
    windowSizeInSeconds: 60,
    message: 'Demasiados intentos de inicio de sesión. Por favor, inténtelo de nuevo más tarde.',
  });
}

/**
 * Middleware específico para limitar solicitudes a la API
 */
export function apiRateLimitMiddleware(req: NextRequest): NextResponse {
  return rateLimitMiddleware(req, {
    maxRequests: 50,
    windowSizeInSeconds: 60,
    message: 'Demasiadas solicitudes a la API. Por favor, inténtelo de nuevo más tarde.',
  });
}