// 📊 API para obtener estadísticas de usuarios en tiempo real (protegida - solo admins)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { checkAdminAccess } from '@/app/lib/auth/adminCheck';

export async function GET() {
  try {
    console.log('📊 API stats called - obteniendo estadísticas de usuarios');

    // Verificar permisos de admin
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.hasAccess) {
      return adminCheck.response;
    }

    console.log('✅ Admin access verified for stats by:', adminCheck.user?.email);

    // Obtener conteo total de usuarios
    const { count: totalUsers, error: totalError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('❌ Error obteniendo total de usuarios:', totalError);
      throw totalError;
    }

    // Obtener conteo por roles
    const { data: roleStats, error: roleError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('is_active', true);

    if (roleError) {
      console.error('❌ Error obteniendo estadísticas por rol:', roleError);
      throw roleError;
    }

    // Contar usuarios por rol
    const roleCounts = roleStats?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    // Obtener usuarios activos vs inactivos
    const { count: activeUsers, error: activeError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (activeError) {
      console.error('❌ Error obteniendo usuarios activos:', activeError);
      throw activeError;
    }

    const inactiveUsers = (totalUsers || 0) - (activeUsers || 0);

    // Obtener usuarios creados en el último mes
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { count: newUsersThisMonth, error: newUsersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneMonthAgo.toISOString());

    if (newUsersError) {
      console.error('❌ Error obteniendo usuarios nuevos del mes:', newUsersError);
      throw newUsersError;
    }

    // Obtener estadísticas de estudiantes por año
    const { data: studentYears, error: yearError } = await supabaseAdmin
      .from('users')
      .select('year')
      .eq('role', 'student')
      .eq('is_active', true)
      .not('year', 'is', null);

    if (yearError) {
      console.error('❌ Error obteniendo estadísticas por año:', yearError);
      throw yearError;
    }

    const yearCounts = studentYears?.reduce((acc, student) => {
      if (student.year) {
        acc[student.year] = (acc[student.year] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>) || {};

    const stats = {
      total: totalUsers || 0,
      active: activeUsers || 0,
      inactive: inactiveUsers,
      newThisMonth: newUsersThisMonth || 0,
      byRole: {
        admin: roleCounts.admin || 0,
        teacher: roleCounts.teacher || 0,
        student: roleCounts.student || 0
      },
      studentsByYear: yearCounts,
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ Estadísticas obtenidas exitosamente:', stats);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('💥 Error en API stats:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al obtener estadísticas de usuarios',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
