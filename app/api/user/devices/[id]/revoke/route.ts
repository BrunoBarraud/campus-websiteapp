import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { createSecurityNotification, SecurityNotificationType } from '@/app/lib/services/security-notifications';

/**
 * Endpoint para revocar una sesión de dispositivo específica
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: deviceId } = await params;

    // Verificar que el dispositivo pertenece al usuario
    const { data: deviceData, error: deviceError } = await supabaseAdmin
      .from('user_sessions')
      .select('id, user_id, session_token, browser, os, ip_address')
      .eq('id', deviceId)
      .eq('user_id', userId)
      .single();

    if (deviceError || !deviceData) {
      return NextResponse.json(
        { error: 'Dispositivo no encontrado o no autorizado' },
        { status: 404 }
      );
    }

    // No permitir revocar la sesión actual
    if (deviceData.session_token === (session as any).sessionToken) {
      return NextResponse.json(
        { error: 'No se puede revocar la sesión actual' },
        { status: 400 }
      );
    }

    // Revocar la sesión (eliminar de la tabla)
    const { error: deleteError } = await supabaseAdmin
      .from('user_sessions')
      .delete()
      .eq('id', deviceId);

    if (deleteError) {
      console.error('Error al revocar sesión:', deleteError);
      return NextResponse.json(
        { error: 'Error al revocar sesión' },
        { status: 500 }
      );
    }

    // Registrar evento en audit_logs
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId,
        action: 'session_revoked',
        details: {
          device_info: `${deviceData.browser} en ${deviceData.os}`,
          ip_address: deviceData.ip_address,
          target_device_id: deviceId,
        },
        ip_address: deviceData.ip_address, // opcional: para filtrar por IP
      });

    // Crear notificación de seguridad → ✅ CORREGIDO: usa el enum
    await createSecurityNotification({
      userId,
      type: SecurityNotificationType.SESSION_REVOKED, // ✅ Correcto: no string literal
      title: 'Sesión cerrada en otro dispositivo',
      message: `Has cerrado sesión en ${deviceData.browser} en ${deviceData.os}`,
      details: {
        device_info: `${deviceData.browser} en ${deviceData.os}`,
        ip_address: deviceData.ip_address,
        revoked_at: new Date().toISOString(),
      },
      requiresAction: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error inesperado al revocar sesión:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}