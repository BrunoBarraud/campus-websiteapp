import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '@/app/lib/services';
import { supabaseAdmin } from '@/app/lib/supabaseClient';
import { requireSession, canManageSubject, SessionUser } from '@/app/lib/auth/routeGuards';
import { createAccessDeniedResponse } from '@/app/lib/auth/adminCheck';

const EDITABLE_FIELDS = ['title', 'content', 'content_type', 'unit_id', 'is_pinned'] as const;

// Verifica que el usuario sea admin o profesor de la materia a la que pertenece el contenido
async function authorizeContent(user: SessionUser, contentId: string): Promise<NextResponse | null> {
  const { data: content } = await supabaseAdmin
    .from('subject_content')
    .select('subject_id')
    .eq('id', contentId)
    .single();

  if (!content) {
    return NextResponse.json({ error: 'Contenido no encontrado' }, { status: 404 });
  }

  if (!(await canManageSubject(user, content.subject_id))) {
    return createAccessDeniedResponse('No tienes permisos para modificar este contenido');
  }

  return null;
}

// PUT /api/content/[id] - Actualizar contenido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireSession(['admin', 'teacher']);
    if (!guard.ok) return guard.response;

    const { id: contentId } = await params;
    const denied = await authorizeContent(guard.user, contentId);
    if (denied) return denied;

    const body = await request.json();
    const updates: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (body && field in body) updates[field] = body[field];
    }

    const updatedContent = await contentService.updateContent(contentId, updates);
    
    return NextResponse.json(updatedContent);
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el contenido' },
      { status: 500 }
    );
  }
}

// DELETE /api/content/[id] - Eliminar contenido
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireSession(['admin', 'teacher']);
    if (!guard.ok) return guard.response;

    const { id: contentId } = await params;
    const denied = await authorizeContent(guard.user, contentId);
    if (denied) return denied;
    
    const success = await contentService.deleteContent(contentId);
    
    if (success) {
      return NextResponse.json({ message: 'Contenido eliminado correctamente' });
    } else {
      return NextResponse.json(
        { error: 'Error al eliminar el contenido' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el contenido' },
      { status: 500 }
    );
  }
}
