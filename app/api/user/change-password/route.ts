import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth-options';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/app/lib/security/password-policy';
import { logSecurityEvent } from '@/app/lib/services/audit-log';
import { notifyPasswordChanged } from '@/app/lib/services/security-notifications';
import { sanitizeText } from '@/app/lib/utils/sanitize';

/**
 * Endpoint para cambiar la contraseña del usuario
 */
export async function POST(req: NextRequest) {
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
    const { currentPassword, newPassword } = await req.json();
    
    // Validar datos de entrada
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos' },
        { status: 400 }
      );
    }
    
    // Sanitizar entradas
    const sanitizedCurrentPassword = sanitizeText(currentPassword);
    const sanitizedNewPassword = sanitizeText(newPassword);
    
    // Validar la nueva contraseña según la política
    const passwordValidation = validatePassword(sanitizedNewPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }
    
    // Obtener usuario actual
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar contraseña actual
    const isCurrentPasswordValid = await bcrypt.compare(
      sanitizedCurrentPassword,
      user.password
    );
    
    if (!isCurrentPasswordValid) {
      // Registrar intento fallido
      await logSecurityEvent(userId, 'PASSWORD_CHANGE_FAILED', {
        reason: 'current_password_invalid',
        ip: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
      });
      
      return NextResponse.json(
        { error: 'La contraseña actual es incorrecta' },
        { status: 400 }
      );
    }
    
    // Generar hash de la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(sanitizedNewPassword, salt);
    
    // Actualizar contraseña en la base de datos
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password: hashedPassword,
        password_changed_at: new Date().toISOString(),
        force_password_change: false
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error al actualizar contraseña:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar contraseña' },
        { status: 500 }
      );
    }
    
    // Registrar cambio exitoso
    await logSecurityEvent(userId, 'PASSWORD_CHANGED', {
      ip: req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    });
    
    // Enviar notificación de cambio de contraseña
    await notifyPasswordChanged(userId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error inesperado al cambiar contraseña:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}