/**
 * API para obtener registros de auditoría
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { logSecurityEvent } from '@/app/lib/services/audit-log';

/**
 * GET: Obtener registros de auditoría
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación y permisos
    const session = await auth();
    
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Verificar que el usuario sea administrador
    if (session?.user?.role !== 'admin') {
      // Registrar intento de acceso no autorizado
      await logSecurityEvent(
        session?.user?.id ?? 'unknown',
        'unauthorized_access_attempt',
        { 
          endpoint: '/api/admin/security/audit-logs',
          userRole: session?.user?.role ?? 'unknown',
        },
        req as unknown as Request
      );
      
      return new NextResponse(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Obtener parámetros de consulta
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const action = url.searchParams.get('action');
    
    // Construir consulta
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100)) // Limitar a máximo 100 registros por consulta
      .range(offset, offset + Math.min(limit, 100) - 1);
    
    // Aplicar filtro por acción si se especifica
    if (action) {
      query = query.ilike('action', `%${action}%`);
    }
    
    // Ejecutar consulta
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error al obtener registros de auditoría:', error);
      return new NextResponse(JSON.stringify({ error: 'Error al obtener registros' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Devolver resultados
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error inesperado:', error);
    return new NextResponse(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}