import { NextRequest, NextResponse } from 'next/server';
import { contentService } from '@/app/lib/services';

// PUT /api/subjects/[id]/content/[contentId] - Actualizar contenido
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const { contentId } = await params;
    const updateData = await request.json();
    
    const updatedContent = await contentService.updateContent(contentId, updateData);
    
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
    const { contentId } = await params;
    
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
