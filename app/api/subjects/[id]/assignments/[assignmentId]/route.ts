// 📋 API para gestión individual de tareas
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// PUT - Actualizar una tarea específica
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId, assignmentId } = await params;
    
    const {
      title,
      description,
      instructions,
      due_date,
      max_score,
      is_active,
      unit_id
    } = await request.json();

    // Verificar que la materia existe y el usuario tiene permisos
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id, teacher_id')
      .eq('id', subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    if (currentUser.role === 'teacher' && subject.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta materia' },
        { status: 403 }
      );
    }

    // Verificar que la tarea existe
    const { data: existingAssignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('id')
      .eq('id', assignmentId)
      .eq('subject_id', subjectId)
      .single();

    if (assignmentError || !existingAssignment) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Actualizar la tarea
    const { data: updatedAssignment, error: updateError } = await supabaseAdmin
      .from('assignments')
      .update({
        title,
        description,
        instructions,
        due_date,
        max_score,
        is_active,
        unit_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating assignment:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la tarea' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedAssignment);

  } catch (error) {
    console.error('Error en PUT /api/subjects/[id]/assignments/[assignmentId]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una tarea específica
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId, assignmentId } = await params;

    // Verificar que la materia existe y el usuario tiene permisos
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id, teacher_id')
      .eq('id', subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    if (currentUser.role === 'teacher' && subject.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta materia' },
        { status: 403 }
      );
    }

    // Verificar que la tarea existe
    const { data: existingAssignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('id')
      .eq('id', assignmentId)
      .eq('subject_id', subjectId)
      .single();

    if (assignmentError || !existingAssignment) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      );
    }

    // Eliminar las entregas relacionadas primero
    await supabaseAdmin
      .from('submissions')
      .delete()
      .eq('assignment_id', assignmentId);

    // Eliminar la tarea
    const { error: deleteError } = await supabaseAdmin
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (deleteError) {
      console.error('Error deleting assignment:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar la tarea' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Tarea eliminada exitosamente' });

  } catch (error) {
    console.error('Error en DELETE /api/subjects/[id]/assignments/[assignmentId]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
