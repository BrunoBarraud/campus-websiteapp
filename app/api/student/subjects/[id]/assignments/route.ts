import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseClient";
import { requireRole } from "@/app/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireRole(['student']);
    const subjectId = params.id;

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

    // Obtener todas las tareas activas de la materia con las entregas del estudiante
    const { data: assignments, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        unit:subject_units (
          id,
          title
        ),
        submissions:assignment_submissions!left (
          id,
          submission_text,
          file_url,
          file_name,
          submitted_at,
          score,
          feedback,
          status
        )
      `)
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .eq('submissions.student_id', user.id)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching assignments:', error);
      return NextResponse.json({ error: 'Error al obtener las tareas' }, { status: 500 });
    }

    // Procesar los datos para que cada tarea tenga una sola entrega (si existe)
    const processedAssignments = assignments?.map(assignment => ({
      ...assignment,
      submission: assignment.submissions?.[0] || null,
      submissions: undefined // Remover el array original
    })) || [];

    return NextResponse.json(processedAssignments);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
