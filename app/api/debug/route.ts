import { NextRequest, NextResponse } from 'next/server';

function maskValue(value: string | undefined): string {
  if (!value) return 'missing';
  if (value.length <= 6) return 'configured';
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

export async function GET(req: NextRequest) {
  const host = req.headers.get('host');
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto');
  const forwardedFor = req.headers.get('x-forwarded-for');

  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    request: {
      url: req.url,
      host,
      forwardedHost,
      forwardedProto,
      forwardedFor: forwardedFor ? 'present' : 'missing',
    },
    env: {
      nextauthUrl: process.env.NEXTAUTH_URL || 'missing',
      authUrl: process.env.AUTH_URL || 'missing',
      nextauthUrlInternal: process.env.NEXTAUTH_URL_INTERNAL || 'missing',
      vercelUrl: process.env.VERCEL_URL || 'missing',
      vercelEnv: process.env.VERCEL_ENV || 'missing',
      nextauthSecret: maskValue(process.env.NEXTAUTH_SECRET),
      authSecret: maskValue(process.env.AUTH_SECRET),
    },
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
    timestamp: new Date().toISOString()
  });
}
