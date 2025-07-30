// NextAuth configuration types

export const NEXTAUTH_CONFIG = {
  debug: process.env.NODE_ENV === 'development',
  // Configuración específica para App Router
  experimental: {
    appDir: true
  }
} as const;

export default NEXTAUTH_CONFIG;
