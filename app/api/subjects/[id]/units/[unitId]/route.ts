import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// PUT /api/subjects/[id]/units/[unitId] - Actualizar una unidad
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId, unitId } = await params;
    const updateData = await request.json();

    // Verificar que la unidad pertenece a la materia
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('subject_units')
      .select('id, subject_id')
      .eq('id', unitId)
      .single();

    if (unitError || !unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    if (unit.subject_id !== subjectId) {
      return NextResponse.json(
        { error: 'La unidad no pertenece a la materia indicada' },
        { status: 400 }
      );
    }

    // Si es teacher, validar que sea el dueño de la materia
    if (currentUser.role === 'teacher') {
      const { data: subject, error: subjectError } = await supabaseAdmin
        .from('subjects')
        .select('id')
        .eq('id', subjectId)
        .eq('teacher_id', currentUser.id)
        .single();

      if (subjectError || !subject) {
        return NextResponse.json(
          { error: 'No tienes permiso para editar unidades de esta materia' },
          { status: 403 }
        );
      }
    }

    const { data: updatedUnit, error: updateError } = await supabaseAdmin
      .from('subject_units')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', unitId)
      .select('*')
      .single();

    if (updateError || !updatedUnit) {
      console.error('Error updating unit:', updateError);
      return NextResponse.json(
        { error: updateError?.message || 'Error al actualizar la unidad' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUnit);
  } catch (error) {
    console.error('Error updating unit:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la unidad' },
      { status: 500 }
    );
  }
}

// DELETE /api/subjects/[id]/units/[unitId] - Eliminar una unidad
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId, unitId } = await params;

    // Verificar que la unidad existe y pertenece a la materia
    const { data: unit, error: unitError } = await supabaseAdmin
      .from('subject_units')
      .select('id, subject_id')
      .eq('id', unitId)
      .single();

    if (unitError || !unit) {
      return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 });
    }

    if (unit.subject_id !== subjectId) {
      return NextResponse.json(
        { error: 'La unidad no pertenece a la materia indicada' },
        { status: 400 }
      );
    }

    if (currentUser.role === 'teacher') {
      const { data: subject, error: subjectError } = await supabaseAdmin
        .from('subjects')
        .select('id')
        .eq('id', subjectId)
        .eq('teacher_id', currentUser.id)
        .single();

      if (subjectError || !subject) {
        return NextResponse.json(
          { error: 'No tienes permiso para eliminar unidades de esta materia' },
          { status: 403 }
        );
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from('subject_units')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', unitId);

    if (deleteError) {
      console.error('Error deleting unit:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Error al eliminar la unidad' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Unidad eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting unit:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la unidad' },
      { status: 500 }
    );
  }
}
