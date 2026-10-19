import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import type { NextFetchEvent } from "next/server";
import { csrfMiddleware } from "./app/lib/middleware/csrf";
import { loginRateLimitMiddleware, apiRateLimitMiddleware } from "./app/lib/middleware/rate-limit";
import { SCHOOLS } from "./app/lib/schools";

const SCHOOL_COOKIE_NAME = "campus_school";

// Middleware principal que aplica seguridad y autenticación
const authMiddleware = auth(function handler(req: NextRequest, _event: NextFetchEvent) {
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

  // Para rutas de API y formularios, aplicar protección CSRF (verificación de Origin)
  if ((req.nextUrl.pathname.startsWith('/api') || req.nextUrl.pathname.includes('/auth/')) && !isPublicRoute) {
    const csrfResponse = csrfMiddleware(req);
    if (csrfResponse.status === 403) {
      return csrfResponse;
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

type MiddlewareHandler = (req: NextRequest, event: NextFetchEvent) => Promise<Response>;

// Con la configuración lazy de NextAuth (`NextAuth(async (req) => ...)`), `auth(handler)`
// devuelve una Promise del handler envuelto, no el handler. Por eso `export default auth(...)`
// exportaba una Promise y Next no reconocía el middleware.
export async function middleware(req: NextRequest, event: NextFetchEvent) {
  const run = await (authMiddleware as unknown as Promise<MiddlewareHandler>);
  return run(req, event);
}

export const config = {
  // `auth` usa supabase-js, bcrypt y crypto: requiere el runtime de Node (no Edge)
  runtime: 'nodejs',
  matcher: [
    '/',
    '/campus/:path*',
    '/admin/:path*',
    '/api/:path*'
  ]
};
