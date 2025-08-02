// 📊 API para gestión individual de calificaciones
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// GET - Obtener una calificación específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gradeId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher', 'student']);
    const { gradeId } = await params;

    let query = supabaseAdmin
      .from('grades')
      .select(`
        id,
        student_id,
        subject_id,
        assignment_id,
        grade_type,
        score,
        max_score,
        percentage,
        comments,
        graded_by,
        graded_at,
        created_at,
        student:users!grades_student_id_fkey(id, name, email),
        assignment:assignments(id, title, due_date),
        grader:users!grades_graded_by_fkey(id, name)
      `)
      .eq('id', gradeId);

    // Si es estudiante, solo puede ver sus propias calificaciones
    if (currentUser.role === 'student') {
      query = query.eq('student_id', currentUser.id);
    }

    const { data, error } = await query.single();

    if (error) {
      console.error('Error fetching grade:', error);
      return NextResponse.json(
        { error: 'Calificación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error('Error in GET /api/subjects/[id]/grades/[gradeId]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT - Actualizar calificación (solo profesores y admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gradeId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { gradeId } = await params;

    const {
      score,
      max_score,
      comments,
      grade_type
    } = await request.json();

    // Validaciones
    if (score === undefined || !max_score) {
      return NextResponse.json(
        { error: 'Puntaje y puntaje máximo son requeridos' },
        { status: 400 }
      );
    }

    if (score < 0 || score > max_score) {
      return NextResponse.json(
        { error: 'El puntaje debe estar entre 0 y el puntaje máximo' },
        { status: 400 }
      );
    }

    // Verificar que la calificación existe
    const { data: existingGrade, error: gradeError } = await supabaseAdmin
      .from('grades')
      .select('id, student_id, subject_id')
      .eq('id', gradeId)
      .single();

    if (gradeError || !existingGrade) {
      return NextResponse.json(
        { error: 'Calificación no encontrada' },
        { status: 404 }
      );
    }

    const percentage = (score / max_score) * 100;

    const { data, error } = await supabaseAdmin
      .from('grades')
      .update({
        score,
        max_score,
        percentage,
        comments: comments || null,
        grade_type: grade_type || undefined,
        graded_by: currentUser.id,
        graded_at: new Date().toISOString()
      })
      .eq('id', gradeId)
      .select(`
        id,
        student_id,
        subject_id,
        assignment_id,
        grade_type,
        score,
        max_score,
        percentage,
        comments,
        graded_by,
        graded_at,
        created_at,
        student:users!grades_student_id_fkey(id, name, email),
        assignment:assignments(id, title, due_date),
        grader:users!grades_graded_by_fkey(id, name)
      `)
      .single();

    if (error) {
      console.error('Error updating grade:', error);
      return NextResponse.json(
        { error: 'Error al actualizar la calificación' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);

  } catch (error: unknown) {
    console.error('Error in PUT /api/subjects/[id]/grades/[gradeId]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar calificación (solo profesores y admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gradeId: string }> }
) {
  try {
    await requireRole(['admin', 'teacher']);
    const { gradeId } = await params;

    // Verificar que la calificación existe
    const { data: existingGrade, error: gradeError } = await supabaseAdmin
      .from('grades')
      .select('id, student_id, subject_id')
      .eq('id', gradeId)
      .single();

    if (gradeError || !existingGrade) {
      return NextResponse.json(
        { error: 'Calificación no encontrada' },
        { status: 404 }
      );
    }

    const { error } = await supabaseAdmin
      .from('grades')
      .delete()
      .eq('id', gradeId);

    if (error) {
      console.error('Error deleting grade:', error);
      return NextResponse.json(
        { error: 'Error al eliminar la calificación' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Calificación eliminada exitosamente' 
    });

  } catch (error: unknown) {
    console.error('Error in DELETE /api/subjects/[id]/grades/[gradeId]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
