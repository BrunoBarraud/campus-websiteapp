import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { csrfMiddleware } from "./lib/middleware/csrf";
import { loginRateLimitMiddleware, apiRateLimitMiddleware } from "./lib/middleware/rate-limit";
import { securityHeadersMiddleware } from "./lib/middleware/security-headers";

// Middleware compuesto que combina autenticación y CSRF
const authMiddleware = withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      const { pathname } = req.nextUrl;
      
      // Rutas públicas del campus (auth)
      if (pathname.startsWith('/campus/auth/')) {
        return true;
      }
      
      // Rutas protegidas del campus requieren autenticación
      if (pathname.startsWith('/campus')) {
        return !!token;
      }
      
      // Rutas admin requieren rol específico
      if (pathname.startsWith('/admin')) {
        return token?.role === 'admin';
      }
      
      // Otras rutas son públicas
      return true;
    },
  },
  pages: {
    signIn: '/campus/auth/login',
  }
});

// Middleware principal que aplica seguridad y autenticación
export default function middleware(req: NextRequest) {
  // Excluir rutas públicas de la protección
  const isPublicRoute = (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/public') ||
    req.nextUrl.pathname === '/'
  );

  // Aplicar rate limiting para login
  if (req.nextUrl.pathname === '/campus/auth/login' && req.method === 'POST') {
    const rateLimitResponse = loginRateLimitMiddleware(req);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
  }

  // Aplicar rate limiting para API
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const rateLimitResponse = apiRateLimitMiddleware(req);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
  }

  // Para rutas de API y formularios, aplicar protección CSRF
  if ((req.nextUrl.pathname.startsWith('/api') || req.nextUrl.pathname.includes('/auth/')) && !isPublicRoute) {
    // Solo aplicar CSRF a métodos no GET
    if (req.method !== 'GET') {
      return csrfMiddleware(req);
    }
  }

  // Aplicar middleware de autenticación
  const authResponse = authMiddleware(req as any, NextResponse.next() as any);
  
  // Aplicar encabezados de seguridad a todas las respuestas
  // Esto debe ser lo último para asegurar que se apliquen a todas las respuestas
  return securityHeadersMiddleware(req);
}

export const config = {
  matcher: [
    '/campus/:path*',
    '/admin/:path*',
    '/api/:path*'
  ]
};
