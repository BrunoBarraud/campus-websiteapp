import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import type { NextFetchEvent } from "next/server";
import { csrfMiddleware } from "./lib/middleware/csrf";
import { loginRateLimitMiddleware, apiRateLimitMiddleware } from "./lib/middleware/rate-limit";

// Middleware principal que aplica seguridad y autenticación
export default function middleware(req: NextRequest, event: NextFetchEvent) {
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
  return auth(req as any);
}

// Función auxiliar para verificar autorización
async function isAuthorized(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;
  
  // Rutas públicas del campus (auth)
  if (pathname.startsWith('/campus/auth/')) {
    return true;
  }
  
  // Rutas protegidas del campus requieren autenticación
  if (pathname.startsWith('/campus')) {
    return !!session?.user;
  }
  
  // Rutas admin requieren rol específico
  if (pathname.startsWith('/admin')) {
    return session?.user?.role === 'admin';
  }
  
  // Otras rutas son públicas
  return true;
}

export const config = {
  matcher: [
    '/campus/:path*',
    '/admin/:path*',
    '/api/:path*'
  ]
};
