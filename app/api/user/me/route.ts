// 👤 API para obtener información del usuario actual
import { NextResponse } from 'next/server';
import { userService } from '@/app/lib/services';
import { getUserPermissions } from '@/app/lib/types';

// GET - Obtener usuario actual con sus permisos
export async function GET() {
  try {
    const currentUser = await userService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const permissions = getUserPermissions(currentUser.role);

    // Devolver directamente los datos del usuario para facilitar el acceso en el frontend
    return NextResponse.json({
      ...currentUser,
      permissions
    });

  } catch (error: any) {
    console.error('Error getting current user:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Error al obtener usuario actual' 
      },
      { status: 500 }
    );
  }
}
