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
      .select('id, name, email, role, year, is_active, created_at, updated_at')
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

// POST - Crear nuevo usuario (temporal sin autenticación para testing)
export async function POST(request: Request) {
  try {
    console.log('📝 POST: Creando nuevo usuario');
    
    const {
      name,
      email,
      role,
      year,
      is_active
    } = await request.json();

    console.log('📝 Datos recibidos:', { name, email, role, year, is_active });

    // Validaciones básicas
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Nombre, email y rol son requeridos' },
        { status: 400 }
      );
    }

    // Validar email único
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese email' },
        { status: 400 }
      );
    }

    // Crear el usuario
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        role,
        year: role === 'student' ? (year || 1) : null,
        is_active: is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, name, email, role, year, is_active, created_at, updated_at')
      .single();

    if (error) {
      console.error('❌ Error creating user:', error);
      return NextResponse.json(
        { error: 'Error al crear el usuario' },
        { status: 500 }
      );
    }

    console.log('✅ Usuario creado exitosamente:', data);
    return NextResponse.json({
      success: true,
      data
    });

  } catch (error: any) {
    console.error('💥 Error in POST /api/users:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
