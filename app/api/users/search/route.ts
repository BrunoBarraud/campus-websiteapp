// 🔍 API para búsqueda de usuarios con filtros
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

// GET - Buscar usuarios por nombre y email
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validar que hay un término de búsqueda
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        users: [],
        message: 'Ingresa al menos 2 caracteres para buscar'
      });
    }

    // Buscar usuarios por nombre y email (excluyendo al usuario actual)
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, avatar_url, online, last_seen, role')
      .neq('id', currentUser.id)
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('online', { ascending: false })
      .order('last_seen', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching users:', error);
      return NextResponse.json(
        { error: 'Error al buscar usuarios' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      query,
      total: users?.length || 0
    });

  } catch (error: unknown) {
    console.error('Error in user search:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.message === 'Usuario no autenticado' ? 401 : 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error al buscar usuarios' },
      { status: 500 }
    );
  }
}