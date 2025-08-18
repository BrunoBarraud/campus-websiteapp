import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

/**
 * Endpoint para obtener el conteo de notificaciones no leídas del usuario actual
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // Obtener conteo de notificaciones no leídas
    const { count, error } = await supabaseAdmin
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    
    if (error) {
      console.error('Error al obtener conteo de notificaciones:', error);
      return NextResponse.json(
        { error: 'Error al obtener conteo de notificaciones' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error inesperado en API de conteo de notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}