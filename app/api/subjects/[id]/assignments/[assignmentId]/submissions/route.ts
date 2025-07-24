import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const user = await requireRole(['teacher', 'admin']);
    const subjectId = params.id;
    const assignmentId = params.assignmentId;

    // Verificar que el profesor puede acceder a esta materia
    if (user.role === 'teacher') {
      const { data: teacherSubject } = await supabaseAdmin
        .from('teacher_subjects')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .single();

      if (!teacherSubject) {
        return NextResponse.json(
          { error: 'No tienes acceso a esta materia' },
          { status: 403 }
        );
      }
    }

    // Obtener todas las entregas de la tarea con información del estudiante
    const { data: submissions, error } = await supabaseAdmin
      .from('assignment_submissions')
      .select(`
        *,
        student:users!assignment_submissions_student_id_fkey (
          id,
          name,
          email
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: 'Error al obtener las entregas' }, { status: 500 });
    }

    return NextResponse.json(submissions || []);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; assignmentId: string } }
) {
  try {
    const user = await requireRole(['student']);
    const subjectId = params.id;
    const assignmentId = params.assignmentId;
    const body = await request.json();

    // Verificar que el estudiante está inscrito en la materia
    const { data: studentSubject } = await supabaseAdmin
      .from('student_subjects')
      .select('id')
      .eq('student_id', user.id)
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .single();

    if (!studentSubject) {
      return NextResponse.json(
        { error: 'No estás inscrito en esta materia' },
        { status: 403 }
      );
    }

    // Verificar que la tarea existe y está activa
    const { data: assignment } = await supabaseAdmin
      .from('assignments')
      .select('id, due_date, is_active')
      .eq('id', assignmentId)
      .eq('subject_id', subjectId)
      .single();

    if (!assignment || !assignment.is_active) {
      return NextResponse.json(
        { error: 'Tarea no encontrada o inactiva' },
        { status: 404 }
      );
    }

    // Verificar si ya existe una entrega
    const { data: existingSubmission } = await supabaseAdmin
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .single();

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'Ya has entregado esta tarea' },
        { status: 400 }
      );
    }

    // Determinar el estado basado en la fecha de entrega
    const isLate = new Date() > new Date(assignment.due_date);
    const status = isLate ? 'late' : 'submitted';

    // Crear la entrega
    const { data: submission, error } = await supabaseAdmin
      .from('assignment_submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: user.id,
        submission_text: body.submission_text || null,
        file_url: body.file_url || null,
        file_name: body.file_name || null,
        status: status,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating submission:', error);
      return NextResponse.json({ error: 'Error al crear la entrega' }, { status: 500 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest
) {
  try {
    const user = await requireRole(['teacher', 'admin', 'student']);
    const body = await request.json();

    if (user.role === 'student') {
      // Los estudiantes solo pueden editar sus propias entregas
      const { data: submission } = await supabaseAdmin
        .from('assignment_submissions')
        .select('id, status, assignment:assignments!inner(due_date)')
        .eq('id', body.submissionId)
        .eq('student_id', user.id)
        .single();

      if (!submission) {
        return NextResponse.json(
          { error: 'Entrega no encontrada' },
          { status: 404 }
        );
      }

      // No permitir editar entregas ya calificadas
      if (submission.status === 'graded') {
        return NextResponse.json(
          { error: 'No puedes editar una entrega ya calificada' },
          { status: 400 }
        );
      }

      // Actualizar la entrega del estudiante
      const { data: updatedSubmission, error } = await supabaseAdmin
        .from('assignment_submissions')
        .update({
          submission_text: body.submission_text || null,
          file_url: body.file_url || null,
          file_name: body.file_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', body.submissionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating submission:', error);
        return NextResponse.json({ error: 'Error al actualizar la entrega' }, { status: 500 });
      }

      return NextResponse.json(updatedSubmission);
    } else {
      // Profesores y administradores pueden calificar
      const { data: updatedSubmission, error } = await supabaseAdmin
        .from('assignment_submissions')
        .update({
          score: body.score,
          feedback: body.feedback || null,
          status: 'graded',
          graded_by: user.id,
          graded_at: new Date().toISOString(),
        })
        .eq('id', body.submissionId)
        .select()
        .single();

      if (error) {
        console.error('Error grading submission:', error);
        return NextResponse.json({ error: 'Error al calificar la entrega' }, { status: 500 });
      }

      return NextResponse.json(updatedSubmission);
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
