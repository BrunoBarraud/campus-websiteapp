/**
 * Servicio para registrar eventos de seguridad y auditoría
 */

import { supabaseAdmin } from '../supabaseClient';

// Tipos de eventos de auditoría
export enum AuditEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  PROFILE_UPDATE = 'profile_update',
  ROLE_CHANGE = 'role_change',
  CONTENT_CREATE = 'content_create',
  CONTENT_UPDATE = 'content_update',
  CONTENT_DELETE = 'content_delete',
  ADMIN_ACTION = 'admin_action',
  SECURITY_VIOLATION = 'security_violation',
}

// Interfaz para los datos de eventos de auditoría
interface AuditLogData {
  userId?: string;
  email?: string;
  action: AuditEventType;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra un evento de auditoría en la base de datos
 * @param data Datos del evento de auditoría
 * @returns Resultado de la operación
 */
export async function logAuditEvent(data: AuditLogData) {
  try {
    // Asegurar que los detalles sean un objeto JSON válido
    const details = data.details ? JSON.stringify(data.details) : null;
    
    // Insertar el evento en la tabla de auditoría
    const { data: result, error } = await supabaseAdmin
      .from('audit_logs')
      .insert([
        {
          user_id: data.userId || null,
          email: data.email || null,
          action: data.action,
          details: details,
          ip_address: data.ipAddress || null,
          user_agent: data.userAgent || null,
          created_at: new Date().toISOString(),
        },
      ]);
    
    if (error) {
      // Registrar el error pero no fallar la operación principal
      console.error('Error al registrar evento de auditoría:', error);
      return { success: false, error };
    }
    
    return { success: true, data: result };
  } catch (error) {
    // Registrar el error pero no fallar la operación principal
    console.error('Error inesperado al registrar evento de auditoría:', error);
    return { success: false, error };
  }
}

/**
 * Registra un intento de inicio de sesión exitoso
 */
export async function logSuccessfulLogin(userId: string, email: string, req?: Request) {
  const headers = req?.headers;
  const ipAddress = headers?.get('x-forwarded-for') || headers?.get('x-real-ip') || 'unknown';
  const userAgent = headers?.get('user-agent') || 'unknown';
  
  return logAuditEvent({
    userId,
    email,
    action: AuditEventType.LOGIN_SUCCESS,
    ipAddress: ipAddress.toString(),
    userAgent: userAgent.toString(),
  });
}

/**
 * Registra un intento de inicio de sesión fallido
 */
export async function logFailedLogin(email: string, reason: string, req?: Request) {
  const headers = req?.headers;
  const ipAddress = headers?.get('x-forwarded-for') || headers?.get('x-real-ip') || 'unknown';
  const userAgent = headers?.get('user-agent') || 'unknown';
  
  return logAuditEvent({
    email,
    action: AuditEventType.LOGIN_FAILURE,
    details: { reason },
    ipAddress: ipAddress.toString(),
    userAgent: userAgent.toString(),
  });
}

/**
 * Registra un evento de seguridad
 */
export async function logSecurityEvent(userId: string | undefined, eventType: string, details: Record<string, any>, req?: Request) {
  const headers = req?.headers;
  const ipAddress = headers?.get('x-forwarded-for') || headers?.get('x-real-ip') || 'unknown';
  const userAgent = headers?.get('user-agent') || 'unknown';
  
  return logAuditEvent({
    userId,
    action: AuditEventType.SECURITY_VIOLATION,
    details: { eventType, ...details },
    ipAddress: ipAddress.toString(),
    userAgent: userAgent.toString(),
  });
}