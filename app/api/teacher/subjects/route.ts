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
        units_count:subject_units(count),
        contents_count:subject_content(count),
        documents_count:documents(count)
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

    // Enriquecer con información adicional
    const enrichedSubjects = await Promise.all(
      (subjects || []).map(async (subject) => {
        // Contar unidades
        const { count: unitsCount } = await supabaseAdmin
          .from('subject_units')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', subject.id)
          .eq('is_active', true);

        // Contar contenidos
        const { count: contentsCount } = await supabaseAdmin
          .from('subject_content')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', subject.id)
          .eq('is_active', true);

        // Contar documentos
        const { count: documentsCount } = await supabaseAdmin
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .eq('subject_id', subject.id)
          .eq('is_active', true);

        return {
          ...subject,
          stats: {
            units_count: unitsCount || 0,
            contents_count: contentsCount || 0,
            documents_count: documentsCount || 0
          }
        };
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
