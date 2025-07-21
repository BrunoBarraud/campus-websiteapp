import { NextRequest, NextResponse } from 'next/server';
import { unitService } from '@/app/lib/services';

// PUT /api/subjects/[id]/units/[unitId] - Actualizar una unidad
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; unitId: string }> }
) {
  try {
    const { unitId } = await params;
    const updateData = await request.json();
    
    const updatedUnit = await unitService.updateUnit(unitId, updateData);
    
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
    const { unitId } = await params;
    
    const success = await unitService.deleteUnit(unitId);
    
    if (success) {
      return NextResponse.json({ message: 'Unidad eliminada correctamente' });
    } else {
      return NextResponse.json(
        { error: 'Error al eliminar la unidad' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting unit:', error);
    return NextResponse.json(
      { error: 'Error al eliminar la unidad' },
      { status: 500 }
    );
  }
}
