import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { logSecurityEvent } from '@/app/lib/services/audit-log';

/**
 * Endpoint para obtener notificaciones de seguridad del usuario actual
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
    
    // Obtener notificaciones de seguridad del usuario
    const { data: notifications, error } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .in('type', [
        'account_locked',
        'suspicious_login',
        'password_changed',
        'admin_action',
        'security_alert'
      ])
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('Error al obtener notificaciones:', error);
      return NextResponse.json(
        { error: 'Error al obtener notificaciones' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error inesperado en API de notificaciones:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}