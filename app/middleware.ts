import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import type { NextFetchEvent } from "next/server";
import { csrfMiddleware } from "./lib/middleware/csrf";
import { loginRateLimitMiddleware, apiRateLimitMiddleware } from "./lib/middleware/rate-limit";
import { SCHOOLS } from "./lib/schools";

const SCHOOL_COOKIE_NAME = "campus_school";

// Middleware principal que aplica seguridad y autenticación
export default auth(function middleware(req: NextRequest, _event: NextFetchEvent) {
  const schoolParam = req.nextUrl.searchParams.get("school");
  const shouldSetSchoolCookie = !!(schoolParam && SCHOOLS[schoolParam]);

  const attachSchoolCookie = (res: NextResponse) => {
    if (shouldSetSchoolCookie) {
      res.cookies.set(SCHOOL_COOKIE_NAME, schoolParam as string, {
        path: "/",
        sameSite: "lax",
      });
    }
    return res;
  };

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
      const csrfResponse = csrfMiddleware(req);
      return attachSchoolCookie(csrfResponse);
    }
  }

  const pathname = req.nextUrl.pathname;
  const isCampusAuthRoute = pathname.startsWith('/campus/auth/');

  if (pathname.startsWith('/campus') && !isCampusAuthRoute) {
    if (!(req as any).auth?.user) {
      const loginUrl = new URL('/campus/auth/login', req.url);
      return attachSchoolCookie(NextResponse.redirect(loginUrl));
    }
  }

  if (pathname.startsWith('/admin')) {
    const role = (req as any).auth?.user?.role;
    if (role !== 'admin') {
      const fallbackUrl = new URL('/campus/dashboard', req.url);
      return attachSchoolCookie(NextResponse.redirect(fallbackUrl));
    }
  }

  return attachSchoolCookie(NextResponse.next());
});

export const config = {
  matcher: [
    '/',
    '/campus/:path*',
    '/admin/:path*',
    '/api/:path*'
  ]
};
