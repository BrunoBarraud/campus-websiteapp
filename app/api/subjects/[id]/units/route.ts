// 📋 API para gestión de unidades de materias (Profesores y Administradores)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// GET - Obtener todas las unidades de una materia
export async function GET(
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
        { error: 'No tienes permisos para acceder a esta materia' },
        { status: 403 }
      );
    }

    // Obtener las unidades
    const { data: units, error } = await supabaseAdmin
      .from('subject_units')
      .select(`
        id,
        subject_id,
        unit_number,
        title,
        description,
        order_index,
        is_visible,
        is_active,
        created_at,
        updated_at
      `)
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('order_index');

    if (error) {
      console.error('Error fetching units:', error);
      return NextResponse.json(
        { error: 'Error al obtener las unidades' },
        { status: 500 }
      );
    }

    return NextResponse.json(units || []);

  } catch (error: any) {
    console.error('Error in GET /api/subjects/[id]/units:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST - Crear nueva unidad
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId } = await params;

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

    const { title, description, unit_number } = await request.json();

    // Validaciones
    if (!title || !unit_number) {
      return NextResponse.json(
        { error: 'Título y número de unidad son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que no exista una unidad con el mismo número
    const { data: existingUnit } = await supabaseAdmin
      .from('subject_units')
      .select('id')
      .eq('subject_id', subjectId)
      .eq('unit_number', unit_number)
      .single();

    if (existingUnit) {
      return NextResponse.json(
        { error: 'Ya existe una unidad con ese número' },
        { status: 400 }
      );
    }

    // Obtener el siguiente order_index
    const { data: maxOrder } = await supabaseAdmin
      .from('subject_units')
      .select('order_index')
      .eq('subject_id', subjectId)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex = maxOrder && maxOrder.length > 0 
      ? maxOrder[0].order_index + 1 
      : 1;

    // Crear la unidad
    const { data, error } = await supabaseAdmin
      .from('subject_units')
      .insert([{
        subject_id: subjectId,
        unit_number,
        title,
        description: description || null,
        order_index: nextOrderIndex,
        is_active: true,
        is_visible: true
      }])
      .select(`
        id,
        subject_id,
        unit_number,
        title,
        description,
        order_index,
        is_visible,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error creating unit:', error);
      return NextResponse.json(
        { error: 'Error al crear la unidad' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Error in POST /api/subjects/[id]/units:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar unidad existente
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId } = await params;

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

    const { id: unitId, title, description, unit_number, is_visible } = await request.json();

    // Validaciones
    if (!unitId || !title || !unit_number) {
      return NextResponse.json(
        { error: 'ID, título y número de unidad son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que la unidad existe y pertenece a la materia
    const { data: existingUnit, error: unitError } = await supabaseAdmin
      .from('subject_units')
      .select('id, unit_number')
      .eq('id', unitId)
      .eq('subject_id', subjectId)
      .single();

    if (unitError || !existingUnit) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que no exista otra unidad con el mismo número (excepto la actual)
    if (existingUnit.unit_number !== unit_number) {
      const { data: duplicateUnit } = await supabaseAdmin
        .from('subject_units')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('unit_number', unit_number)
        .neq('id', unitId)
        .single();

      if (duplicateUnit) {
        return NextResponse.json(
          { error: 'Ya existe una unidad con ese número' },
          { status: 400 }
        );
      }
    }

    // Actualizar la unidad
    const { data, error } = await supabaseAdmin
      .from('subject_units')
      .update({
        unit_number,
        title,
        description: description || null,
        ...(typeof is_visible === 'boolean' ? { is_visible } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', unitId)
      .select(`
        id,
        subject_id,
        unit_number,
        title,
        description,
        order_index,
        is_visible,
        is_active,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('Error updating unit:', error);
      return NextResponse.json(
        { error: 'Error al actualizar la unidad' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error in PUT /api/subjects/[id]/units:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar unidad (y todas sus tareas asociadas)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId } = await params;

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

    const { id: unitId } = await request.json();

    // Validaciones
    if (!unitId) {
      return NextResponse.json(
        { error: 'ID de unidad es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la unidad existe y pertenece a la materia
    const { data: existingUnit, error: unitError } = await supabaseAdmin
      .from('subject_units')
      .select('id')
      .eq('id', unitId)
      .eq('subject_id', subjectId)
      .single();

    if (unitError || !existingUnit) {
      return NextResponse.json(
        { error: 'Unidad no encontrada' },
        { status: 404 }
      );
    }

    // Verificar si hay tareas asociadas
    const { data: assignments } = await supabaseAdmin
      .from('assignments')
      .select('id')
      .eq('unit_id', unitId);

    if (assignments && assignments.length > 0) {
      // Eliminar primero las entregas de las tareas
      const assignmentIds = assignments.map(a => a.id);
      
      await supabaseAdmin
        .from('assignment_submissions')
        .delete()
        .in('assignment_id', assignmentIds);

      // Luego eliminar las tareas
      await supabaseAdmin
        .from('assignments')
        .delete()
        .eq('unit_id', unitId);
    }

    // Eliminar contenidos de la unidad
    await supabaseAdmin
      .from('subject_content')
      .delete()
      .eq('unit_id', unitId);

    // Finalmente eliminar la unidad
    const { error } = await supabaseAdmin
      .from('subject_units')
      .delete()
      .eq('id', unitId);

    if (error) {
      console.error('Error deleting unit:', error);
      return NextResponse.json(
        { error: 'Error al eliminar la unidad' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Unidad eliminada exitosamente' });

  } catch (error: any) {
    console.error('Error in DELETE /api/subjects/[id]/units:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
