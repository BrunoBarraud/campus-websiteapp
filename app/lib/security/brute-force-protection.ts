/**
 * Protección contra ataques de fuerza bruta
 */

import { supabaseAdmin } from '../supabaseClient';
import { logSecurityEvent } from '../services/audit-log';

// Umbral de intentos fallidos antes de bloquear temporalmente
const MAX_FAILED_ATTEMPTS = 5;
// Duración del bloqueo en segundos
const LOCKOUT_DURATION = 15 * 60; // 15 minutos

interface LoginAttempt {
  email: string;
  ip_address: string;
  timestamp: number;
  success: boolean;
}

// Almacenamiento en memoria para intentos de inicio de sesión
// En producción, usar Redis u otra solución distribuida
const loginAttempts: LoginAttempt[] = [];

// Limpiar intentos antiguos periódicamente
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  // Eliminar intentos de más de una hora
  const index = loginAttempts.findIndex(attempt => attempt.timestamp < oneHourAgo);
  if (index !== -1) {
    loginAttempts.splice(0, index + 1);
  }
}, 5 * 60 * 1000); // Limpiar cada 5 minutos

/**
 * Registra un intento de inicio de sesión
 */
export async function recordLoginAttempt(email: string, ipAddress: string, success: boolean) {
  loginAttempts.push({
    email,
    ip_address: ipAddress,
    timestamp: Date.now(),
    success,
  });
  
  // Si el intento fue fallido, verificar si se debe bloquear la cuenta
  if (!success) {
    await checkAndBlockAccount(email, ipAddress);
  }
}

/**
 * Verifica si una cuenta o IP debe ser bloqueada por demasiados intentos fallidos
 */
async function checkAndBlockAccount(email: string, ipAddress: string) {
  const now = Date.now();
  const recentWindow = now - (30 * 60 * 1000); // Últimos 30 minutos
  
  // Contar intentos fallidos recientes para esta cuenta
  const recentFailedAttempts = loginAttempts.filter(attempt => 
    attempt.email === email && 
    !attempt.success && 
    attempt.timestamp > recentWindow
  );
  
  // Contar intentos fallidos recientes para esta IP
  const recentFailedAttemptsFromIP = loginAttempts.filter(attempt => 
    attempt.ip_address === ipAddress && 
    !attempt.success && 
    attempt.timestamp > recentWindow
  );
  
  // Si se excede el umbral, bloquear temporalmente
  if (recentFailedAttempts.length >= MAX_FAILED_ATTEMPTS) {
    await temporarilyBlockAccount(email, ipAddress, 'too_many_attempts');
  }
  
  // Si hay demasiados intentos desde la misma IP con diferentes cuentas, bloquear IP
  if (recentFailedAttemptsFromIP.length >= MAX_FAILED_ATTEMPTS * 2) {
    const uniqueEmails = new Set(recentFailedAttemptsFromIP.map(a => a.email)).size;
    if (uniqueEmails >= 3) {
      await temporarilyBlockAccount(email, ipAddress, 'suspicious_ip_activity');
    }
  }
}

/**
 * Bloquea temporalmente una cuenta
 */
async function temporarilyBlockAccount(email: string, ipAddress: string, reason: string) {
  try {
    // Actualizar el estado de la cuenta en la base de datos
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (userError) {
      console.error('Error al buscar usuario para bloqueo temporal:', userError);
      return;
    }
    
    if (user) {
      // Registrar el evento de seguridad
      await logSecurityEvent(
        user.id,
        'account_temporary_lockout',
        { 
          reason,
          ip_address: ipAddress,
          lockout_duration: LOCKOUT_DURATION,
        },
        new Request('', { headers: new Headers() })
      );
      
      // Establecer marca de tiempo de bloqueo
      const lockoutUntil = new Date(Date.now() + (LOCKOUT_DURATION * 1000)).toISOString();
      
      // Actualizar el usuario con el tiempo de bloqueo
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          lockout_until: lockoutUntil,
          failed_login_attempts: MAX_FAILED_ATTEMPTS
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Error al actualizar bloqueo temporal:', updateError);
      }
    }
  } catch (error) {
    console.error('Error al bloquear temporalmente la cuenta:', error);
  }
}

/**
 * Verifica si una cuenta está bloqueada temporalmente
 * @returns true si la cuenta está bloqueada, false si no
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('lockout_until')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return false;
    }
    
    // Si hay un tiempo de bloqueo y aún no ha expirado
    if (user.lockout_until) {
      const lockoutUntil = new Date(user.lockout_until).getTime();
      const now = Date.now();
      
      if (lockoutUntil > now) {
        return true;
      } else {
        // Si el bloqueo ha expirado, reiniciar el contador
        await supabaseAdmin
          .from('users')
          .update({ 
            lockout_until: null,
            failed_login_attempts: 0
          })
          .eq('email', email);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error al verificar bloqueo de cuenta:', error);
    return false;
  }
}