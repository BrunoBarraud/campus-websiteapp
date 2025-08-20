import { NextResponse } from 'next/server';
import { calendarService } from '@/app/lib/services';
import { requireRole } from '@/app/lib/permissions';

// PATCH - actualizar evento (admins y profesores)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const currentUser = await requireRole(['admin', 'teacher']);

    // Validaciones básicas (si vienen campos relevantes)
    if (updates.date) {
      const eventDate = new Date(updates.date);
      const today = new Date();
      if (eventDate < today) {
        return NextResponse.json({ success: false, error: 'No se pueden establecer fechas pasadas' }, { status: 400 });
      }
    }

    const updated = await calendarService.updateEvent(id, updates);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    console.error('Error updating event:', error);
    const message = error instanceof Error ? error.message : 'Error al actualizar evento';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// DELETE - eliminar (marcar inactivo) (admins y profesores)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const currentUser = await requireRole(['admin', 'teacher']);

    const success = await calendarService.deleteEvent(id);

    return NextResponse.json({ success });
  } catch (error: unknown) {
    console.error('Error deleting event:', error);
    const message = error instanceof Error ? error.message : 'Error al eliminar evento';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
