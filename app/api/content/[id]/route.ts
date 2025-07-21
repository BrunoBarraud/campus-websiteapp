import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '@/app/lib/services';

// PUT /api/content/[id] - Actualizar contenido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params;
    const updates = await request.json();
    
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
    const { id: contentId } = await params;
    
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
