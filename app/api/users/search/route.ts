// 👥 API para gestión de usuarios y búsqueda para mensajería
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

// GET - Buscar usuarios para iniciar conversaciones
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireRole(["admin", "teacher", "student"]);
    const { searchParams } = new URL(request.url);
    
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .neq('id', currentUser.id) // Excluir usuario actual
      .eq('is_active', true);

    // Filtros de búsqueda
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Filtro por rol
    if (role && ['admin', 'teacher', 'student'].includes(role)) {
      query = query.eq('role', role);
    }

    // Aplicar restricciones según el rol del usuario actual
    if (currentUser.role === 'student') {
      // Los estudiantes solo pueden ver profesores y administradores
      query = query.in('role', ['teacher', 'admin']);
    }

    query = query.limit(limit).order('name');

    const { data: users, error } = await query;

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json(
        { error: 'Error al buscar usuarios' },
        { status: 500 }
      );
    }

    return NextResponse.json(users || []);

  } catch (error) {
    console.error('Error in users search GET:', error);
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    );
  }
}
