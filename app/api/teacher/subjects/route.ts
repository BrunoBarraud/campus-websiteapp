// 👨‍🏫 API para materias del profesor autenticado
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// GET - Obtener materias del profesor autenticado
export async function GET(request: Request) {
  try {
    const currentUser = await requireRole(['teacher']);

    console.log('Teacher accessing their subjects:', currentUser.email);

    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    // Obtener las materias asignadas al profesor
    let query = supabaseAdmin
      .from('subjects')
      .select(`
        id,
        name,
        code,
        description,
        year,
        semester,
        credits,
        teacher_id,
        image_url,
        is_active,
        created_at,
        updated_at,
        teacher:users!subjects_teacher_id_fkey(id, name, email)
      `)
      .eq('teacher_id', currentUser.id)
      .eq('is_active', true)
      .order('year')
      .order('name');

    if (year) {
      query = query.eq('year', parseInt(year));
    }

    const { data: subjects, error } = await query;

    if (error) {
      console.error('Error fetching teacher subjects:', error);
      return NextResponse.json(
        { error: 'Error al obtener las materias' },
        { status: 500 }
      );
    }

    console.log('Teacher subjects found:', subjects?.length || 0);

    // Enriquecer con estadísticas de manera opcional
    const enrichedSubjects = await Promise.all(
      (subjects || []).map(async (subject) => {
        try {
          return {
            ...subject,
            stats: {
              units_count: 0,
              contents_count: 0,
              documents_count: 0
            }
          };
        } catch (enrichError) {
          console.error('Error enriching subject:', subject.id, enrichError);
          return {
            ...subject,
            stats: {
              units_count: 0,
              contents_count: 0,
              documents_count: 0
            }
          };
        }
      })
    );

    return NextResponse.json(enrichedSubjects);

  } catch (error: any) {
    console.error('Error in GET /api/teacher/subjects:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
