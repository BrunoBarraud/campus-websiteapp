import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// POST - Inscribir estudiante en materia automáticamente
export async function POST(
  request: NextRequest
) {
  try {
    const currentUser = await requireRole(['student']);
    
    // Obtener todas las materias del año del estudiante
    const { data: subjects, error: subjectsError } = await supabaseAdmin
      .from('subjects')
      .select('id')
      .eq('year', currentUser.year)
      .eq('is_active', true);

    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError);
      return NextResponse.json(
        { error: 'Error al obtener las materias' },
        { status: 500 }
      );
    }

    // Inscribir al estudiante en todas las materias de su año
    const enrollments = subjects?.map(subject => ({
      student_id: currentUser.id,
      subject_id: subject.id
    })) || [];

    if (enrollments.length > 0) {
      const { error: enrollError } = await supabaseAdmin
        .from('student_subjects')
        .upsert(enrollments, { 
          onConflict: 'student_id,subject_id',
          ignoreDuplicates: true 
        });

      if (enrollError) {
        console.error('Error enrolling student:', enrollError);
        return NextResponse.json(
          { error: 'Error al inscribir en las materias' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ 
      success: true, 
      enrolled: enrollments.length,
      message: `Inscrito exitosamente en ${enrollments.length} materias`
    });

  } catch (error: unknown) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET - Obtener materias del estudiante
export async function GET() {
  try {
    const currentUser = await requireRole(['student']);
    
    const { data: enrolledSubjects, error } = await supabaseAdmin
      .from('student_subjects')
      .select(`
        id,
        enrolled_at,
        subject:subjects(
          id,
          name,
          code,
          description,
          year,
          credits,
          teacher:users!subjects_teacher_id_fkey(id, name, email)
        )
      `)
      .eq('student_id', currentUser.id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching enrolled subjects:', error);
      return NextResponse.json(
        { error: 'Error al obtener las materias' },
        { status: 500 }
      );
    }

    return NextResponse.json(enrolledSubjects || []);

  } catch (error: unknown) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
