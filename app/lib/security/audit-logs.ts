// app/lib/security/audit-logs.ts
import { supabaseAdmin } from '@/app/lib/supabaseClient';


// Tipos de acciones (acciones auditables)
export type AuditAction =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'TWO_FACTOR_ENABLED'
  | 'TWO_FACTOR_DISABLED'
  | 'TWO_FACTOR_SETUP_INITIATED'
  | 'TWO_FACTOR_VERIFICATION_FAILED'
  | 'PASSWORD_CHANGED'
  | 'SESSION_EXPIRED'
  | 'ACCOUNT_LOCKED'
  | 'SECURITY_ALERT'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'SETTINGS_UPDATED';

// Estructura del log
export interface AuditLog {
  userId?: string;          // Opcional: puede ser null (ej: login fallido sin usuario)
  email?: string;           // Para eventos sin usuario autenticado
  action: AuditAction;
  details: Record<string, any> | string; // Puede ser objeto o string
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Registra un evento en la tabla audit_logs
 */
export async function logSecurityEvent(log: AuditLog): Promise<void> {
  try {
    // Normalizar details a objeto
    const details = typeof log.details === 'string' 
      ? { message: log.details } 
      : log.details;

    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert([
        {
          user_id: log.userId || null,
          email: log.email || null,
          action: log.action,
          details: details,
          ip_address: log.ipAddress || null,
          user_agent: log.userAgent || null,
        },
      ]);

    if (error) {
      console.error('Error al registrar evento de auditoría:', error);
    } else {
      console.log(`Auditoría registrada: ${log.action} - ${log.userId || log.email}`);
    }
  } catch (err) {
    console.error('Error inesperado al registrar auditoría:', err);
  }
}

