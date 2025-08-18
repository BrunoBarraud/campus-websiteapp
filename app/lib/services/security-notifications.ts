/**
 * Servicio para enviar notificaciones de seguridad
 */

import { supabaseAdmin } from '../supabaseClient';
import { AuditEventType } from './audit-log';

/**
 * Tipos de notificaciones de seguridad
 */
export enum SecurityNotificationType {
  ACCOUNT_LOCKED = 'account_locked',
  SUSPICIOUS_LOGIN = 'suspicious_login',
  PASSWORD_CHANGED = 'password_changed',
  ADMIN_ACTION = 'admin_action',
  SECURITY_ALERT = 'security_alert',
  SESSION_REVOKED = 'session_revoked',
}

/**
 * Interfaz para los datos de notificaciones de seguridad
 */
interface SecurityNotificationData {
  userId: string;
  type: SecurityNotificationType;
  title: string;
  message: string;
  details?: Record<string, any>;
  requiresAction?: boolean;
  actionUrl?: string;
}

/**
 * Crea una notificación de seguridad para un usuario
 * @param data Datos de la notificación
 * @returns Resultado de la operación
 */
export async function createSecurityNotification(data: SecurityNotificationData) {
  try {
    // Insertar la notificación en la base de datos
    const { data: result, error } = await supabaseAdmin
      .from('notifications')
      .insert([
        {
          user_id: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          details: data.details ? JSON.stringify(data.details) : null,
          requires_action: data.requiresAction || false,
          action_url: data.actionUrl || null,
          is_read: false,
          created_at: new Date().toISOString(),
        },
      ]);
    
    if (error) {
      console.error('Error al crear notificación de seguridad:', error);
      return { success: false, error };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error inesperado al crear notificación de seguridad:', error);
    return { success: false, error };
  }
}

/**
 * Notifica a un usuario sobre un intento de inicio de sesión sospechoso
 */
export async function notifySuspiciousLogin(userId: string, ipAddress: string, userAgent: string) {
  return createSecurityNotification({
    userId,
    type: SecurityNotificationType.SUSPICIOUS_LOGIN,
    title: 'Intento de inicio de sesión sospechoso',
    message: `Detectamos un intento de inicio de sesión desde una ubicación desconocida. Si no fuiste tú, por favor cambia tu contraseña inmediatamente.`,
    details: { ipAddress, userAgent, timestamp: new Date().toISOString() },
    requiresAction: true,
    actionUrl: '/campus/profile/security',
  });
}

/**
 * Notifica a un usuario sobre un bloqueo de cuenta
 */
export async function notifyAccountLocked(userId: string, reason: string) {
  return createSecurityNotification({
    userId,
    type: SecurityNotificationType.ACCOUNT_LOCKED,
    title: 'Cuenta bloqueada temporalmente',
    message: `Tu cuenta ha sido bloqueada temporalmente por motivos de seguridad. Podrás intentar iniciar sesión nuevamente después de 15 minutos.`,
    details: { reason, timestamp: new Date().toISOString() },
    requiresAction: false,
  });
}

/**
 * Notifica a un usuario sobre un cambio de contraseña
 */
export async function notifyPasswordChanged(userId: string) {
  return createSecurityNotification({
    userId,
    type: SecurityNotificationType.PASSWORD_CHANGED,
    title: 'Contraseña actualizada',
    message: `Tu contraseña ha sido actualizada correctamente. Si no realizaste este cambio, por favor contacta al administrador inmediatamente.`,
    details: { timestamp: new Date().toISOString() },
    requiresAction: false,
  });
}

/**
 * Notifica a los administradores sobre un evento de seguridad importante
 */
export async function notifyAdminsSecurityEvent(eventType: AuditEventType, details: Record<string, any>) {
  try {
    // Obtener todos los usuarios administradores
    const { data: admins, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .eq('is_active', true);
    
    if (error || !admins || admins.length === 0) {
      console.error('Error al obtener administradores:', error);
      return { success: false, error };
    }
    
    // Crear notificaciones para cada administrador
    const promises = admins.map(admin => {
      return createSecurityNotification({
        userId: admin.id,
        type: SecurityNotificationType.SECURITY_ALERT,
        title: 'Alerta de seguridad',
        message: `Se ha detectado un evento de seguridad importante: ${eventType}`,
        details: { ...details, timestamp: new Date().toISOString() },
        requiresAction: true,
        actionUrl: '/admin/security',
      });
    });
    
    await Promise.all(promises);
    
    return { success: true };
  } catch (error) {
    console.error('Error al notificar a administradores:', error);
    return { success: false, error };
  }
}