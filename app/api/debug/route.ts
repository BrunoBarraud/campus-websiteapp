import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    nextauthUrl: process.env.NEXTAUTH_URL ? 'configured' : 'missing',
    nextauthSecret: process.env.NEXTAUTH_SECRET ? 'configured' : 'missing',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'configured' : 'missing',
    timestamp: new Date().toISOString()
  });
}
