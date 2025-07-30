// 📚 API para gestión de materias (Solo administradores y profesores)
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// GET - Obtener todas las materias (con filtros opcionales)
export async function GET(request: Request) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    
    console.log('User accessing admin subjects:', currentUser.email, 'Role:', currentUser.role);

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const teacher_id = searchParams.get('teacher_id');

    let query = supabaseAdmin
      .from('subjects')
      .select(`
        id,
        name,
        code,
        description,
        year,
        semester,
        credits,
        division,
        teacher_id,
        image_url,
        is_active,
        created_at,
        updated_at
      `)
      .order('year')
      .order('name');

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    if (teacher_id) {
      query = query.eq('teacher_id', teacher_id);
    }

    // Si es profesor, solo ver sus materias asignadas
    if (currentUser.role === 'teacher') {
      query = query.eq('teacher_id', currentUser.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching subjects:', error);
      return NextResponse.json(
        { error: 'Error al obtener las materias' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);

  } catch (error: unknown) {
    console.error('Error in GET /api/admin/subjects:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Crear nueva materia (Solo administradores)
export async function POST(request: Request) {
  try {
    await requireRole(['admin']);

    const {
      name,
      code,
      description,
      year,
      semester,
      credits,
      division,
      teacher_id,
      image_url
    } = await request.json();

    // Validaciones
    if (!name || !code || !year) {
      return NextResponse.json(
        { error: 'Nombre, código y año son requeridos' },
        { status: 400 }
      );
    }

    if (year < 1 || year > 6) {
      return NextResponse.json(
        { error: 'El año debe estar entre 1 y 6' },
        { status: 400 }
      );
    }

    // Verificar que el código no exista
    const { data: existingSubject } = await supabaseAdmin
      .from('subjects')
      .select('id')
      .eq('code', code)
      .single();

    if (existingSubject) {
      return NextResponse.json(
        { error: 'Ya existe una materia con ese código' },
        { status: 400 }
      );
    }

    // Verificar que el profesor existe si se asigna uno
    if (teacher_id) {
      const { data: teacher } = await supabaseAdmin
        .from('users')
        .select('id, role')
        .eq('id', teacher_id)
        .eq('role', 'teacher')
        .single();

      if (!teacher) {
        return NextResponse.json(
          { error: 'El profesor seleccionado no existe o no tiene rol de profesor' },
          { status: 400 }
        );
      }
    }

    // Crear la materia
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert([{
        name,
        code,
        description,
        year,
        semester: semester || 1,
        credits: credits || 3,
        division: division || null,
        teacher_id: teacher_id || null,
        image_url: image_url || null,
        is_active: true
      }])
      .select(`
        id,
        name,
        code,
        description,
        year,
        semester,
        credits,
        division,
        teacher_id,
        image_url,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating subject:', error);
      return NextResponse.json(
        { error: 'Error al crear la materia' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: unknown) {
    console.error('Error in POST /api/admin/subjects:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
