import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import * as speakeasy from 'speakeasy';
import { logSecurityEvent } from '@/app/lib/security/audit-logs';

/**
 * Endpoint para verificar y activar la autenticación de dos factores
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener datos del cuerpo de la solicitud
    const { userId, verificationCode, setupKey } = await request.json();

    // Verificar que el usuario solicitado sea el mismo que está autenticado
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado para verificar 2FA para este usuario' }, { status: 403 });
    }

    // Verificar que el código sea válido
    const verified = speakeasy.totp.verify({
      secret: setupKey,
      encoding: 'base32',
      token: verificationCode,
      window: 1 // Permite una ventana de 1 intervalo (30 segundos antes/después)
    });

    if (!verified) {
      // Registrar intento fallido
      await logSecurityEvent({
        userId,
        action: 'TWO_FACTOR_VERIFICATION_FAILED',
        details: 'Intento fallido de verificación de código 2FA',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });

      return NextResponse.json({ error: 'Código de verificación incorrecto' }, { status: 400 });
    }

    // Activar 2FA para el usuario
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        two_factor_enabled: true,
        two_factor_secret: setupKey,
        two_factor_secret_temp: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error al activar 2FA:', error);
      return NextResponse.json({ error: 'Error al activar 2FA' }, { status: 500 });
    }

    // Registrar el evento de seguridad
    await logSecurityEvent({
      userId,
      action: 'TWO_FACTOR_ENABLED',
      details: 'Autenticación de dos factores activada correctamente',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Devolver éxito
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en el endpoint de verificación de 2FA:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}