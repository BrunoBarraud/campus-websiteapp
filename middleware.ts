import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Si no hay token y está en una ruta protegida, redirigir al login
    if (
      !token &&
      pathname.startsWith("/campus") &&
      !pathname.startsWith("/campus/auth")
    ) {
      return NextResponse.redirect(new URL("/campus/auth/login", req.url));
    }

    // Si hay token, verificar acceso por rol
    if (token) {
      const userRole = token.role as string;

      // Rutas de administrador
      if (pathname.startsWith("/campus/admin") && userRole !== "admin") {
        return NextResponse.redirect(new URL("/campus/dashboard", req.url));
      }

      // Rutas de profesor
      if (
        pathname.startsWith("/campus/teacher") &&
        userRole !== "teacher" &&
        userRole !== "admin"
      ) {
        return NextResponse.redirect(new URL("/campus/dashboard", req.url));
      }

      // Rutas de estudiante
      if (
        pathname.startsWith("/campus/student") &&
        userRole !== "student" &&
        userRole !== "admin"
      ) {
        return NextResponse.redirect(new URL("/campus/dashboard", req.url));
      }

      // Si está autenticado y va al login, redirigir según rol
      if (pathname === "/campus/auth/login") {
        switch (userRole) {
          case "admin":
            return NextResponse.redirect(new URL("/campus/admin", req.url));
          case "teacher":
            return NextResponse.redirect(new URL("/campus/teacher", req.url));
          case "student":
            return NextResponse.redirect(new URL("/campus/dashboard", req.url));
          default:
            return NextResponse.redirect(new URL("/campus/dashboard", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Permitir acceso público a rutas de auth
        if (pathname.startsWith("/campus/auth")) {
          return true;
        }

        // Permitir acceso a rutas que no sean del campus
        if (!pathname.startsWith("/campus")) {
          return true;
        }

        // Para rutas del campus, requiere token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/campus/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
