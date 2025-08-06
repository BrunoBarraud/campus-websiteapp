// 📄 API para gestión de contenidos de unidades (Profesores y Administradores)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// GET - Obtener contenidos de una unidad específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher', 'student']);
    const { id: subjectId, unitId } = await params;

    // Verificar que la materia existe
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id, name, teacher_id')
      .eq('id', subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que la unidad existe y pertenece a la materia
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('subject_units')
      .select('id, title')
      .eq('id', unitId)
      .eq('subject_id', subjectId)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      );
    }

    // Si es profesor, verificar que es su materia
    if (currentUser.role === 'teacher' && subject.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta materia' },
        { status: 403 }
      );
    }

    // Obtener los contenidos de la unidad
    const { data: contents, error } = await supabaseAdmin
      .from('subject_content')
      .select(`
        id,
        subject_id,
        unit_id,
        content_type,
        title,
        content,
        created_by,
        is_pinned,
        is_active,
        created_at,
        updated_at,
        creator:users!subject_content_created_by_fkey(id, name, email)
      `)
      .eq('subject_id', subjectId)
      .eq('unit_id', unitId)
      .eq('is_active', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contents:', error);
      return NextResponse.json(
        { error: 'Error al obtener los contenidos' },
        { status: 500 }
      );
    }

    return NextResponse.json(contents || []);

  } catch (error: any) {
    console.error('Error in GET /api/subjects/[id]/units/[unitId]/contents:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo contenido en una unidad
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId, unitId } = await params;

    // Verificar que la materia existe y el profesor tiene acceso
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id, name, teacher_id')
      .eq('id', subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    // Si es profesor, verificar que es su materia
    if (currentUser.role === 'teacher' && subject.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta materia' },
        { status: 403 }
      );
    }

    // Verificar que la unidad existe y pertenece a la materia
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('subject_units')
      .select('id')
      .eq('id', unitId)
      .eq('subject_id', subjectId)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      );
    }

    const { title, content, content_type, is_pinned } = await request.json();

    // Validaciones
    if (!title || !content || !content_type) {
      return NextResponse.json(
        { error: 'Título, contenido y tipo de contenido son requeridos' },
        { status: 400 }
      );
    }

    // Tipos de contenido válidos
    const validContentTypes = ['text', 'video', 'document', 'link', 'assignment'];
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json(
        { error: 'Tipo de contenido inválido' },
        { status: 400 }
      );
    }

    // Crear el contenido
    const { data, error } = await supabaseAdmin
      .from('subject_content')
      .insert([{
        subject_id: subjectId,
        unit_id: unitId,
        title,
        content,
        content_type,
        created_by: currentUser.id,
        is_pinned: is_pinned || false,
        is_active: true
      }])
      .select(`
        id,
        subject_id,
        unit_id,
        content_type,
        title,
        content,
        created_by,
        is_pinned,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating content:', error);
      return NextResponse.json(
        { error: 'Error al crear el contenido' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/subjects/[id]/units/[unitId]/contents:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
