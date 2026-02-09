import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

export async function GET() {
  try {
    // Obtener todas las divisiones únicas de las materias activas
    const { data: subjects, error } = await supabaseAdmin
      .from('subjects')
      .select('division, year')
      .eq('is_active', true)
      .not('division', 'is', null);

    if (error) {
      console.error('Error fetching divisions:', error);
      return NextResponse.json(
        { error: 'Error al obtener divisiones' },
        { status: 500 }
      );
    }

    // Agrupar divisiones por año
    const divisionsByYear: Record<number, Set<string>> = {};
    
    subjects?.forEach((subject) => {
      if (subject.year && subject.division) {
        if (!divisionsByYear[subject.year]) {
          divisionsByYear[subject.year] = new Set();
        }
        divisionsByYear[subject.year].add(subject.division);
      }
    });

    // Convertir Sets a arrays y ordenar
    const result: Record<number, string[]> = {};
    Object.keys(divisionsByYear).forEach((year) => {
      const yearNum = parseInt(year);
      result[yearNum] = Array.from(divisionsByYear[yearNum]).sort();
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in divisions API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
