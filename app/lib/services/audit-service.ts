import { supabaseAdmin } from '../supabaseClient';

/**
 * Tipos de acciones de auditoría
 */
export enum AuditAction {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET_REQUEST = 'password_reset_request',
  PASSWORD_RESET_COMPLETE = 'password_reset_complete',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  PROFILE_UPDATE = 'profile_update',
  SESSION_REVOKED = 'session_revoked',
  ADMIN_ACTION = 'admin_action',
  SECURITY_SETTING_CHANGE = 'security_setting_change'
}

/**
 * Interfaz para los datos de auditoría
 */
export interface AuditData {
  userId?: string;
  email?: string;
  action: AuditAction | string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra un evento de auditoría en la tabla audit_logs
 */
export async function logAuditEvent(data: AuditData): Promise<void> {
  try {
    const { userId, email, action, details, ipAddress, userAgent } = data;
    
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: userId,
        email,
        action,
        details,
        ip_address: ipAddress,
        user_agent: userAgent
      });
    
    if (error) {
      console.error('Error al registrar evento de auditoría:', error);
    }
  } catch (error) {
    console.error('Error inesperado al registrar evento de auditoría:', error);
  }
}

/**
 * Obtiene los eventos de auditoría de un usuario específico
 */
export async function getUserAuditEvents(userId: string, limit: number = 10): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error al obtener eventos de auditoría:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error inesperado al obtener eventos de auditoría:', error);
    return [];
  }
}

/**
 * Obtiene todos los eventos de auditoría (para administradores)
 */
export async function getAllAuditEvents(limit: number = 100, offset: number = 0): Promise<any[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error al obtener todos los eventos de auditoría:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error inesperado al obtener todos los eventos de auditoría:', error);
    return [];
  }
}