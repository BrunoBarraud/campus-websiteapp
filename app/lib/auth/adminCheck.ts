// 🔒 Utilidades para verificar permisos de administrador en el servidor
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { NextResponse } from 'next/server';

export async function checkAdminAccess() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return {
        hasAccess: false,
        error: 'No autenticado',
        response: NextResponse.json(
          { 
            success: false,
            error: 'Acceso denegado. Debes iniciar sesión.',
            code: 'UNAUTHORIZED'
          },
          { status: 401 }
        )
      };
    }

    if (session.user?.role !== 'admin') {
      return {
        hasAccess: false,
        error: 'No es administrador',
        response: NextResponse.json(
          { 
            success: false,
            error: 'Acceso denegado. Esta operación requiere permisos de administrador.',
            code: 'FORBIDDEN',
            userRole: session.user?.role
          },
          { status: 403 }
        )
      };
    }

    return {
      hasAccess: true,
      session,
      user: session.user
    };

  } catch (error) {
    console.error('Error verificando permisos de admin:', error);
    return {
      hasAccess: false,
      error: 'Error interno',
      response: NextResponse.json(
        { 
          success: false,
          error: 'Error interno del servidor al verificar permisos.',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      )
    };
  }
}

// Función helper para crear responses de error de permisos
export function createAccessDeniedResponse(message?: string, statusCode: number = 403) {
  return NextResponse.json(
    { 
      success: false,
      error: message || 'Acceso denegado. Permisos insuficientes.',
      code: statusCode === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN'
    },
    { status: statusCode }
  );
}
