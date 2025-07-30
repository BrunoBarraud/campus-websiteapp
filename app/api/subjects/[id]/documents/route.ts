// 📁 API para gestión de documentos (Profesores, Administradores y Estudiantes)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// GET - Obtener documentos de una materia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher', 'student']);
    const { id: subjectId } = await params;
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unit_id');

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

    // Si es profesor, verificar que es su materia
    if (currentUser.role === 'teacher' && subject.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para acceder a esta materia' },
        { status: 403 }
      );
    }

    // Construir la consulta
    let query = supabaseAdmin
      .from('documents')
      .select(`
        id,
        title,
        description,
        file_name,
        file_url,
        file_type,
        file_size,
        subject_id,
        unit_id,
        uploaded_by,
        year,
        is_public,
        is_active,
        created_at,
        updated_at
      `)
      .eq('subject_id', subjectId)
      .eq('is_active', true);

    // Filtrar por unidad si se especifica
    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    // Si es estudiante, solo mostrar documentos públicos
    if (currentUser.role === 'student') {
      query = query.eq('is_public', true);
    }

    const { data: documents, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        { error: 'Error al obtener los documentos' },
        { status: 500 }
      );
    }

    return NextResponse.json(documents || []);

  } catch (error: unknown) {
    console.error('Error in GET /api/subjects/[id]/documents:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Subir nuevo documento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher', 'student']);
    const { id: subjectId } = await params;

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

    // Si es profesor, verificar que es su materia
    if (currentUser.role === 'teacher' && subject.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para subir archivos a esta materia' },
        { status: 403 }
      );
    }

    const {
      title,
      description,
      file_name,
      file_url,
      file_type,
      file_size,
      unit_id,
      is_public
    } = await request.json();

    // Validaciones
    if (!title || !file_name || !file_url) {
      return NextResponse.json(
        { error: 'Título, nombre de archivo y URL son requeridos' },
        { status: 400 }
      );
    }

    // Si se especifica unit_id, verificar que existe
    if (unit_id) {
      const { data: unit, error: unitError } = await supabaseAdmin
        .from('subject_units')
        .select('id')
        .eq('id', unit_id)
        .eq('subject_id', subjectId)
        .single();

      if (unitError || !unit) {
        return NextResponse.json(
          { error: 'Unidad no encontrada' },
          { status: 404 }
        );
      }
    }

    // Los estudiantes solo pueden subir documentos privados por defecto
    const documentIsPublic = currentUser.role === 'student' ? false : (is_public || false);

    // Crear el documento
    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert([{
        title,
        description: description || null,
        file_name,
        file_url,
        file_type: file_type || 'unknown',
        file_size: file_size || 0,
        subject_id: subjectId,
        unit_id: unit_id || null,
        uploaded_by: currentUser.id,
        year: new Date().getFullYear(),
        is_public: documentIsPublic,
        is_active: true
      }])
      .select(`
        id,
        title,
        description,
        file_name,
        file_url,
        file_type,
        file_size,
        subject_id,
        unit_id,
        uploaded_by,
        year,
        is_public,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating document:', error);
      return NextResponse.json(
        { error: 'Error al crear el documento' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: unknown) {
    console.error('Error in POST /api/subjects/[id]/documents:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
