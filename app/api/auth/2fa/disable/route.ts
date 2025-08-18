import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { logSecurityEvent } from '@/app/lib/security/audit-logs';

/**
 * Endpoint para desactivar la autenticación de dos factores
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener datos del cuerpo de la solicitud
    const { userId } = await request.json();

    // Verificar que el usuario solicitado sea el mismo que está autenticado
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado para desactivar 2FA para este usuario' }, { status: 403 });
    }

    // Desactivar 2FA para el usuario
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        two_factor_secret_temp: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error al desactivar 2FA:', error);
      return NextResponse.json({ error: 'Error al desactivar 2FA' }, { status: 500 });
    }

    // Registrar el evento de seguridad
    await logSecurityEvent({
      userId,
      action: 'TWO_FACTOR_DISABLED',
      details: 'Autenticación de dos factores desactivada',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Devolver éxito
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en el endpoint de desactivación de 2FA:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}