import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
  },
  serverExternalPackages: ['next-auth'],
  async redirects() {
    return [
      {
        source: '/pages/api/auth/:path*',
        destination: '/api/auth/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
