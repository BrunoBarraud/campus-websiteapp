import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { yearHasDivisions } from '@/app/lib/utils/divisions';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { year, division } = await request.json();

    if (!year || year < 1 || year > 6) {
      return NextResponse.json(
        { error: 'Año inválido' },
        { status: 400 }
      );
    }

    // Actualizar el perfil del usuario
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        year,
        division: division || null,
      })
      .eq('id', session.user.id);

    if (updateError) {
      console.error('Error updating user year:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el año' },
        { status: 500 }
      );
    }

    // Auto-inscribir al estudiante en materias de su año y división
    if (session.user?.id) {
      try {
        let query = supabaseAdmin
          .from('subjects')
          .select('id, division')
          .eq('year', year)
          .eq('is_active', true);

        // 1° a 4°: filtra por división (y materias sin división). 5°/6°: incluir todas.
        if (yearHasDivisions(year)) {
          if (division) {
            query = query.or(`division.eq.${division},division.is.null`);
          } else {
            query = query.is('division', null);
          }
        }

        const { data: subjects } = await query;

        if (subjects && subjects.length > 0) {
          const enrollments = subjects.map(subject => ({
            student_id: session.user!.id,
            subject_id: subject.id
          }));

          await supabaseAdmin
            .from('student_subjects')
            .upsert(enrollments, { 
              onConflict: 'student_id,subject_id',
              ignoreDuplicates: true 
            });
          
          console.log(`[Auto-inscripción] Inscrito en ${subjects.length} materias (Año: ${year}, División: ${division || 'sin división'})`);
        }
      } catch (enrollError) {
        console.log('Error en auto-inscripción (no crítico):', enrollError);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Año actualizado exitosamente'
    });

  } catch (error: unknown) {
    console.error('Error in update-year API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
