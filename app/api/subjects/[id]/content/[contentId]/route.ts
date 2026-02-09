import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// PUT /api/subjects/[id]/content/[contentId] - Actualizar contenido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId, contentId } = await params;
    const updateData = await request.json();

    // Verificar que el contenido pertenece a la materia
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('subject_content')
      .select('id, subject_id')
      .eq('id', contentId)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Contenido no encontrado' }, { status: 404 });
    }

    if (existing.subject_id !== subjectId) {
      return NextResponse.json(
        { error: 'El contenido no pertenece a la materia indicada' },
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
          { error: 'No tienes permiso para editar contenido de esta materia' },
          { status: 403 }
        );
      }
    }

    const { data: updatedContent, error: updateError } = await supabaseAdmin
      .from('subject_content')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', contentId)
      .select('*')
      .single();

    if (updateError || !updatedContent) {
      console.error('Error updating content:', updateError);
      return NextResponse.json(
        { error: updateError?.message || 'Error al actualizar el contenido' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el contenido' },
      { status: 500 }
    );
  }
}

// DELETE /api/subjects/[id]/content/[contentId] - Eliminar contenido
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId, contentId } = await params;

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('subject_content')
      .select('id, subject_id')
      .eq('id', contentId)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ error: 'Contenido no encontrado' }, { status: 404 });
    }

    if (existing.subject_id !== subjectId) {
      return NextResponse.json(
        { error: 'El contenido no pertenece a la materia indicada' },
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
          { error: 'No tienes permiso para eliminar contenido de esta materia' },
          { status: 403 }
        );
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from('subject_content')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', contentId);

    if (deleteError) {
      console.error('Error deleting content:', deleteError);
      return NextResponse.json(
        { error: deleteError.message || 'Error al eliminar el contenido' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Contenido eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el contenido' },
      { status: 500 }
    );
  }
}
