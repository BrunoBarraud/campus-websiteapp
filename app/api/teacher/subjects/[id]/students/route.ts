import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// GET: Listar estudiantes inscriptos en una materia
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['teacher', 'admin', 'admin_director']);
    const { id: subjectId } = await params;

    // Verificar que el profesor tiene acceso a esta materia (si no es admin)
    if (currentUser.role === 'teacher' || currentUser.role === 'admin_director') {
      const { data: subject, error: subjectError } = await supabaseAdmin
        .from('subjects')
        .select('id, teacher_id')
        .eq('id', subjectId)
        .single();

      if (subjectError || !subject) {
        return NextResponse.json({ error: 'Materia no encontrada' }, { status: 404 });
      }

      if (subject.teacher_id !== currentUser.id) {
        return NextResponse.json({ error: 'No tenés acceso a esta materia' }, { status: 403 });
      }
    }

    // Obtener estudiantes inscriptos
    const { data: enrollments, error } = await supabaseAdmin
      .from('student_subjects')
      .select(`
        id,
        enrolled_at,
        is_active,
        student:users!student_id (
          id,
          name,
          email,
          year,
          division,
          avatar_url
        )
      `)
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('enrolled_at', { ascending: true });

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Error al obtener estudiantes' }, { status: 500 });
    }

    // Formatear respuesta
    const students = (enrollments || []).map(e => ({
      id: (e.student as any)?.id,
      name: (e.student as any)?.name,
      email: (e.student as any)?.email,
      year: (e.student as any)?.year,
      division: (e.student as any)?.division,
      avatar_url: (e.student as any)?.avatar_url,
      enrolled_at: e.enrolled_at
    }));

    return NextResponse.json({
      success: true,
      data: students,
      total: students.length
    });
  } catch (error: any) {
    console.error('Error in students API:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
