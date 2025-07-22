// 👥 API para obtener usuarios (temporal sin autenticación para testing)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    console.log('👥 API users called');
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role')
      .eq('is_active', true)
      .order('name');

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching users:', error);
      return NextResponse.json(
        { error: 'Error al obtener los usuarios' },
        { status: 500 }
      );
    }

    console.log('✅ Users fetched successfully:', data?.length || 0);

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('💥 Error en API users:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
