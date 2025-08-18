/**
 * Middleware para configurar encabezados de seguridad HTTP
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Aplica encabezados de seguridad a la respuesta HTTP
 * @param req Solicitud entrante
 * @param res Respuesta a modificar
 * @returns Respuesta con encabezados de seguridad
 */
export function securityHeaders(req: NextRequest, res: NextResponse): NextResponse {
  // Clonar la respuesta para no modificar la original
  const response = res.clone();
  
  // Content-Security-Policy
  // Controla qué recursos puede cargar el navegador
  const cspValue = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
    "img-src 'self' data: https://* blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co",
    "frame-src 'self'",
    "object-src 'none'",
  ].join('; ');
  
  // Establecer encabezados de seguridad
  const headers = response.headers;
  
  // Prevenir que el navegador MIME-sniff una respuesta fuera de su tipo declarado
  headers.set('X-Content-Type-Options', 'nosniff');
  
  // Prevenir ataques de clickjacking
  headers.set('X-Frame-Options', 'DENY');
  
  // Habilitar la protección XSS en navegadores modernos
  headers.set('X-XSS-Protection', '1; mode=block');
  
  // Controlar qué recursos puede cargar el navegador
  headers.set('Content-Security-Policy', cspValue);
  
  // Indicar al navegador que debe usar HTTPS
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  
  // Controlar qué características y APIs del navegador puede usar el sitio
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  
  // Controlar qué información se incluye en las solicitudes de referencia
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return NextResponse.json(response);
}

/**
 * Middleware para aplicar encabezados de seguridad
 */
export function securityHeadersMiddleware(req: NextRequest): NextResponse {
  // Continuar con la solicitud
  const response = NextResponse.next();
  
  // Aplicar encabezados de seguridad
  return securityHeaders(req, response);
}