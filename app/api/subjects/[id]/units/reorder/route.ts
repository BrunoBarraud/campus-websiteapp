import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId } = await params;

    // Verificar que la materia existe y el profesor tiene acceso
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id, name, teacher_id')
      .eq('id', subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    // Si es profesor, verificar que es su materia
    if (currentUser.role === 'teacher' && subject.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta materia' },
        { status: 403 }
      );
    }

    const { units } = await request.json();

    if (!Array.isArray(units)) {
      return NextResponse.json(
        { error: 'Formato de datos inválido' },
        { status: 400 }
      );
    }

    // Actualizar el order_index de cada unidad
    for (const [index, unit] of units.entries()) {
      const { error: updateError } = await supabaseAdmin
        .from('subject_units')
        .update({ order_index: index + 1 })
        .eq('id', unit.id)
        .eq('subject_id', subjectId);

      if (updateError) {
        console.error('Error updating unit order:', updateError);
        return NextResponse.json(
          { error: 'Error al actualizar el orden de las unidades' },
          { status: 500 }
        );
      }
    }

    // Obtener las unidades actualizadas
    const { data: updatedUnits, error: fetchError } = await supabaseAdmin
      .from('subject_units')
      .select('*')
      .eq('subject_id', subjectId)
      .order('order_index');

    if (fetchError) {
      console.error('Error fetching updated units:', fetchError);
      return NextResponse.json(
        { error: 'Error al obtener las unidades actualizadas' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUnits);

  } catch (error: any) {
    console.error('Error in PUT /api/subjects/[id]/units/reorder:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
