import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🚀 Optimizaciones de rendimiento
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Optimizaciones de imagen
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60, // Cache mínimo de 1 minuto
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Compresión y optimizaciones
  compress: true,
  poweredByHeader: false,
  
  // Configuración de Turbopack (nuevo bundler estable)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Optimizaciones experimentales
  experimental: {
    // optimizeCss: true, // Desactivado temporalmente por problemas con critters
    optimizePackageImports: ['lucide-react', 'react-icons'],
  },
  
  // Configuración del compilador
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Configuración de bundling
  webpack: (config, { dev, isServer }) => {
    // Optimizaciones de webpack
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            chunks: 'all',
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
            enforce: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
  
  serverExternalPackages: ["next-auth"],
  
  // Headers para cache y seguridad
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
