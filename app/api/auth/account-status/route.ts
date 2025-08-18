/**
 * API para verificar el estado de una cuenta
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { sanitizeText } from '@/app/lib/utils/sanitize';

/**
 * GET: Verificar estado de bloqueo de una cuenta
 */
export async function GET(req: NextRequest) {
  try {
    // Obtener email de los parámetros de consulta
    const url = new URL(req.url);
    const email = url.searchParams.get('email');
    
    if (!email) {
      return new NextResponse(JSON.stringify({ error: 'Email requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Sanitizar el email para prevenir inyección
    const sanitizedEmail = sanitizeText(email);
    
    // Consultar estado de la cuenta
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('lockout_until')
      .eq('email', sanitizedEmail)
      .single();
    
    if (error) {
      // No revelar si el usuario existe o no
      return new NextResponse(JSON.stringify({ isLocked: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Verificar si la cuenta está bloqueada
    let isLocked = false;
    let lockoutUntil = null;
    
    if (user?.lockout_until) {
      const lockoutTime = new Date(user.lockout_until).getTime();
      const now = Date.now();
      
      if (lockoutTime > now) {
        isLocked = true;
        lockoutUntil = user.lockout_until;
      }
    }
    
    return new NextResponse(JSON.stringify({ isLocked, lockoutUntil }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error al verificar estado de cuenta:', error);
    return new NextResponse(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}