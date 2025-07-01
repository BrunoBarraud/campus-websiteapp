// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/firebaseConfig';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  
  // Verificar autenticación para rutas protegidas
  if (request.nextUrl.pathname.startsWith('/campus')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}
