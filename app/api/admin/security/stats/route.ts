import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

/**
 * API para obtener estadísticas de seguridad para el panel de administración
 * Solo accesible para administradores
 */
export async function GET(_request: Request) {
  try {

    // Verificar autenticación
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol de administrador
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener estadísticas de inicios de sesión
    const { data: loginStats, error: loginError } = await supabaseAdmin
      .from('audit_login_stats')
      .select('*');

    if (loginError) {
      console.error('Error al obtener estadísticas de inicios de sesión (se usarán valores por defecto):', loginError);
    }

    // Obtener estadísticas de incidentes de seguridad
    const { data: securityIncidents, error: securityError } = await supabaseAdmin
      .from('audit_logs')
      .select('count')
      .eq('action', 'security_violation');

    if (securityError) {
      console.error('Error al obtener estadísticas de incidentes (se usarán valores por defecto):', securityError);
    }

    // Obtener usuarios activos (con inicio de sesión en los últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('count')
      .gte('last_login_at', thirtyDaysAgo.toISOString());

    if (usersError) {
      console.error('Error al obtener usuarios activos (se usarán valores por defecto):', usersError);
    }

    // Procesar y formatear los datos, usando 0 si alguna consulta falla
    const totalLoginAttempts = loginStats?.reduce((sum: number, item: any) => sum + parseInt(item.count, 10), 0) || 0;
    const failedLoginAttempts = loginStats?.find((item: any) => item.action === 'login_failure')?.count || 0;
    const securityIncidentsCount = Array.isArray(securityIncidents) ? securityIncidents.length : 0;
    const activeUsersCount = Array.isArray(activeUsers) && activeUsers[0]?.count ? activeUsers[0].count : 0;

    return NextResponse.json({
      totalLoginAttempts,
      failedLoginAttempts,
      securityIncidents: securityIncidentsCount,
      activeUsers: activeUsersCount
    });
  } catch (error) {
    console.error('Error al procesar solicitud de estadísticas de seguridad:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}