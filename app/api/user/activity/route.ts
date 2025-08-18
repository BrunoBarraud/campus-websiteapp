import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

/**
 * Endpoint para obtener la actividad reciente del usuario actual
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
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Obtener actividad reciente del usuario desde audit_logs
    const { data: activities, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error al obtener actividad reciente:', error);
      return NextResponse.json(
        { error: 'Error al obtener actividad reciente' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error inesperado en API de actividad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}