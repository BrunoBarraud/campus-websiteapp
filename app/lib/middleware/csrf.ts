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

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Verifica que una solicitud que modifica estado provenga del mismo origen.
 * Los navegadores siempre envían `Origin` (o al menos `Referer`) en POST/PUT/PATCH/DELETE,
 * por lo que una solicitud cross-site queda bloqueada sin requerir cambios en el cliente.
 * Las solicitudes sin ninguno de los dos headers no provienen de un navegador
 * (no son vectores de CSRF) y se dejan pasar: la autorización la hace cada route handler.
 */
export function validateSameOrigin(req: NextRequest): boolean {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  const source = req.headers.get('origin') || req.headers.get('referer');

  if (!source) return true;
  if (!host || source === 'null') return false;

  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

/**
 * Middleware para protección CSRF
 * - Para métodos seguros (GET/HEAD/OPTIONS) no hace nada
 * - Para el resto (POST, PUT, PATCH, DELETE) exige mismo origen (Origin/Referer == Host)
 */
export function csrfMiddleware(req: NextRequest): NextResponse {
  if (SAFE_METHODS.has(req.method)) {
    return NextResponse.next();
  }

  if (!validateSameOrigin(req)) {
    return new NextResponse(JSON.stringify({ error: 'Invalid request origin' }), {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return NextResponse.next();
}
