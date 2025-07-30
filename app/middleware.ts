import { withAuth } from "next-auth/middleware";

export default withAuth({
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

export const config = {
  matcher: [
    '/campus/:path*',
    '/admin/:path*',
    '/api/protected/:path*'
  ]
};
