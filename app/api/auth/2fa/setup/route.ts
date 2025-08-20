import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { logSecurityEvent } from '@/app/lib/security/audit-logs';

/**
 * Endpoint para iniciar la configuración de autenticación de dos factores
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener datos del cuerpo de la solicitud
    const { userId } = await request.json();

    // Verificar que el usuario solicitado sea el mismo que está autenticado
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado para configurar 2FA para este usuario' }, { status: 403 });
    }

    // Generar un secreto para 2FA
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `Campus Virtual (${session.user.email})`,
      issuer: 'Campus Virtual'
    });

    // Generar código QR
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

    // Almacenar temporalmente el secreto en la sesión o en la base de datos
    // Nota: En una implementación real, este secreto debe almacenarse de forma segura
    // hasta que el usuario complete la configuración
    const { error } = await supabaseAdmin
      .from('users')
      .update({
        two_factor_secret_temp: secret.base32,
        two_factor_setup_date: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error al almacenar secreto temporal de 2FA:', error);
      return NextResponse.json({ error: 'Error al configurar 2FA' }, { status: 500 });
    }

    // Registrar el evento de seguridad
    await logSecurityEvent({
      userId,
      action: 'TWO_FACTOR_SETUP_INITIATED',
      details: 'Inicio de configuración de autenticación de dos factores',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // Devolver la información necesaria para la configuración
    return NextResponse.json({
      setupKey: secret.base32,
      qrCodeUrl
    });
  } catch (error) {
    console.error('Error en el endpoint de configuración de 2FA:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}