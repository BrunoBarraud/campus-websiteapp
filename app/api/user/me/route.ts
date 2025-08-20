// 👤 API para obtener información del usuario actual
import { NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { getUserPermissions } from '@/app/lib/types';

// GET - Obtener usuario actual con sus permisos
export async function GET() {
  try {
    const currentUser = await requireAuth();
    
    console.log('User authenticated:', currentUser.email);

    // Actualizar last_seen del usuario actual
    const { supabaseAdmin } = await import('@/app/lib/supabaseClient');
    await supabaseAdmin
      .from('users')
      .update({ 
        last_seen: new Date().toISOString(),
        online: true 
      })
      .eq('id', currentUser.id);

    const permissions = getUserPermissions(currentUser.role);

    // Devolver los datos del usuario con last_seen actualizado
    return NextResponse.json({
      ...currentUser,
      last_seen: new Date().toISOString(),
      online: true,
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
