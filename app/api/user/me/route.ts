// 👤 API para obtener información del usuario actual
import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { getUserPermissions } from '@/app/lib/types';

// GET - Obtener usuario actual con sus permisos
export async function GET() {
  try {
    const currentUser = await requireAuth();
    
    console.log('User authenticated:', currentUser.email);

    const permissions = getUserPermissions(currentUser.role);

    // Devolver directamente los datos del usuario para facilitar el acceso en el frontend
    return NextResponse.json({
      ...currentUser,
      permissions
    });

  } catch (error: unknown) {
    console.error('Error getting current user:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Usuario no autenticado' ? 401 : 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al obtener usuario actual' },
      { status: 500 }
    );
  }
}
