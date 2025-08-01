// 📋 API para gestión individual de contenidos de unidades
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireRole } from '@/app/lib/auth';

// PUT - Actualizar un contenido específico
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string; contentId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId, unitId, contentId } = await params;
    
    const {
      title,
      content,
      content_type,
      is_pinned
    } = await request.json();

    // Verificar que la materia existe y el usuario tiene permisos
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id, teacher_id')
      .eq('id', subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    if (currentUser.role === 'teacher' && subject.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta materia' },
        { status: 403 }
      );
    }

    // Verificar que el contenido existe
    const { data: existingContent, error: contentError } = await supabaseAdmin
      .from('unit_contents')
      .select('id')
      .eq('id', contentId)
      .eq('unit_id', unitId)
      .single();

    if (contentError || !existingContent) {
      return NextResponse.json(
        { error: 'Contenido no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar el contenido
    const { data: updatedContent, error: updateError } = await supabaseAdmin
      .from('unit_contents')
      .update({
        title,
        content,
        content_type,
        is_pinned,
        updated_at: new Date().toISOString()
      })
      .eq('id', contentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating content:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el contenido' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedContent);

  } catch (error) {
    console.error('Error en PUT /api/subjects/[id]/units/[unitId]/contents/[contentId]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar un contenido específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string; contentId: string }> }
) {
  try {
    const currentUser = await requireRole(['admin', 'teacher']);
    const { id: subjectId, unitId, contentId } = await params;

    // Verificar que la materia existe y el usuario tiene permisos
    const { data: subject, error: subjectError } = await supabaseAdmin
      .from('subjects')
      .select('id, teacher_id')
      .eq('id', subjectId)
      .single();

    if (subjectError || !subject) {
      return NextResponse.json(
        { error: 'Materia no encontrada' },
        { status: 404 }
      );
    }

    if (currentUser.role === 'teacher' && subject.teacher_id !== currentUser.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para modificar esta materia' },
        { status: 403 }
      );
    }

    // Verificar que el contenido existe
    const { data: existingContent, error: contentError } = await supabaseAdmin
      .from('unit_contents')
      .select('id')
      .eq('id', contentId)
      .eq('unit_id', unitId)
      .single();

    if (contentError || !existingContent) {
      return NextResponse.json(
        { error: 'Contenido no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el contenido
    const { error: deleteError } = await supabaseAdmin
      .from('unit_contents')
      .delete()
      .eq('id', contentId);

    if (deleteError) {
      console.error('Error deleting content:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar el contenido' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Contenido eliminado exitosamente' });

  } catch (error) {
    console.error('Error en DELETE /api/subjects/[id]/units/[unitId]/contents/[contentId]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
