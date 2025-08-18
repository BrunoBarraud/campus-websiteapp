/**
 * Middleware para protección CSRF (Cross-Site Request Forgery)
 */

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// Nombre de la cookie CSRF
const CSRF_COOKIE = 'csrf_token';
// Nombre del header CSRF
const CSRF_HEADER = 'x-csrf-token';

/**
 * Genera un token CSRF y lo establece como cookie
 */
export function setCsrfToken(req: NextRequest): NextResponse {
  const response = NextResponse.next();
  
  // Verificar si ya existe un token CSRF
  const existingToken = req.cookies.get(CSRF_COOKIE)?.value;
  
  if (!existingToken) {
    // Generar un nuevo token CSRF
    const csrfToken = uuidv4();
    
    // Establecer la cookie con el token CSRF
    // httpOnly: false para que JavaScript pueda leerla y enviarla en headers
    // secure: true en producción para enviar solo por HTTPS
    // sameSite: 'strict' para prevenir que la cookie se envíe en solicitudes cross-site
    response.cookies.set({
      name: CSRF_COOKIE,
      value: csrfToken,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
  }
  
  return response;
}

/**
 * Verifica que el token CSRF en el header coincida con el de la cookie
 */
export function validateCsrfToken(req: NextRequest): boolean {
  // Obtener el token de la cookie
  const cookieToken = req.cookies.get(CSRF_COOKIE)?.value;
  
  // Obtener el token del header
  const headerToken = req.headers.get(CSRF_HEADER);
  
  // Verificar que ambos tokens existan y coincidan
  return !!cookieToken && !!headerToken && cookieToken === headerToken;
}

/**
 * Middleware para protección CSRF
 * - Para solicitudes GET, establece un token CSRF
 * - Para otras solicitudes (POST, PUT, DELETE), valida el token CSRF
 */
export function csrfMiddleware(req: NextRequest): NextResponse {
  // Para solicitudes GET, simplemente establecer el token CSRF
  if (req.method === 'GET') {
    return setCsrfToken(req);
  }
  
  // Para otras solicitudes, validar el token CSRF
  if (!validateCsrfToken(req)) {
    // Si la validación falla, devolver un error 403 Forbidden
    return new NextResponse(JSON.stringify({ error: 'Invalid CSRF token' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  // Si la validación es exitosa, continuar con la solicitud
  return NextResponse.next();
}