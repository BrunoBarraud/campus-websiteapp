import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Permitir acceso si hay token o si no es ruta protegida
      if (req.nextUrl.pathname.startsWith('/campus')) {
        return !!token;
      }
      return true;
    },
  }
});

export const config = {
  matcher: ['/campus/:path*']
};
