// 👥 API para obtener usuarios (protegida - solo admins)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { checkAdminAccess } from '@/app/lib/auth/adminCheck';

export async function GET(request: Request) {
  try {
    console.log('👥 API users called');
    
    // Verificar permisos de admin
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.hasAccess) {
      return adminCheck.response;
    }

    console.log('✅ Admin access verified for user:', adminCheck.user?.email);
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    // Validar parámetros de paginación
    const validatedPage = Math.max(1, page);
    const validatedLimit = Math.min(Math.max(1, limit), 100); // Máximo 100 por página
    const offset = (validatedPage - 1) * validatedLimit;

    console.log('📊 Pagination params:', { page: validatedPage, limit: validatedLimit, offset, search, role, sortBy, sortOrder });

    // Construir query base
    let query = supabaseAdmin
      .from('users')
      .select('id, name, email, role, year, is_active, created_at, updated_at', { count: 'exact' });

    // Aplicar filtros
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Solo usuarios activos por defecto (puede cambiarse con parámetro)
    const includeInactive = searchParams.get('includeInactive') === 'true';
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Aplicar ordenamiento
    const validSortFields = ['name', 'email', 'role', 'created_at', 'updated_at'];
    const validSortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const validSortOrder = sortOrder === 'desc' ? false : true; // true = asc, false = desc
    
    query = query.order(validSortField, { ascending: validSortOrder });

    // Aplicar paginación
    query = query.range(offset, offset + validatedLimit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching users:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Error al obtener los usuarios' 
        },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / validatedLimit);
    const hasNextPage = validatedPage < totalPages;
    const hasPrevPage = validatedPage > 1;

    const paginationInfo = {
      currentPage: validatedPage,
      totalPages,
      totalItems: count || 0,
      itemsPerPage: validatedLimit,
      hasNextPage,
      hasPrevPage,
      startItem: offset + 1,
      endItem: Math.min(offset + validatedLimit, count || 0)
    };

    console.log('✅ Users fetched successfully:', {
      items: data?.length || 0,
      pagination: paginationInfo
    });

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: paginationInfo,
      filters: {
        role: role || 'all',
        search: search || '',
        sortBy: validSortField,
        sortOrder,
        includeInactive
      }
    });

  } catch (error) {
    console.error('💥 Error en API users:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo usuario (protegido - solo admins)
export async function POST(request: Request) {
  try {
    console.log('📝 POST: Creando nuevo usuario');
    
    // Verificar permisos de admin
    const adminCheck = await checkAdminAccess();
    if (!adminCheck.hasAccess) {
      return adminCheck.response;
    }

    console.log('✅ Admin access verified for creating user by:', adminCheck.user?.email);
    
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
