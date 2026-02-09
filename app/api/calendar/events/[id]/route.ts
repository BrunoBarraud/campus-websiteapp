import { NextResponse } from 'next/server';
import { calendarService } from '@/app/lib/services';
import { requireRole } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseClient';

// PATCH - actualizar evento (admins y profesores)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const updates = await request.json();

    const currentUser = await requireRole(['admin', 'teacher', 'student']);

    if (currentUser.role === 'student') {
      const { data: ev, error: evErr } = await supabaseAdmin
        .from('calendar_events')
        .select('id, created_by, is_personal, is_global, year, subject_id')
        .eq('id', id)
        .single();

      if (evErr || !ev) {
        return NextResponse.json({ success: false, error: 'Evento no encontrado' }, { status: 404 });
      }

      const isOwner = ev.created_by === currentUser.id;
      const isPersonal = ev.is_personal === true;

      if (!isOwner || !isPersonal) {
        return NextResponse.json(
          { success: false, error: 'No tienes permisos para modificar este evento' },
          { status: 403 }
        );
      }

      const triesToChangeVisibility =
        'is_personal' in updates ||
        'is_global' in updates ||
        'year' in updates ||
        'subject_id' in updates;

      if (triesToChangeVisibility) {
        return NextResponse.json(
          { success: false, error: 'No puedes cambiar la visibilidad de un evento personal' },
          { status: 403 }
        );
      }
    }

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

    const currentUser = await requireRole(['admin', 'teacher', 'student']);

    if (currentUser.role === 'student') {
      const { data: ev, error: evErr } = await supabaseAdmin
        .from('calendar_events')
        .select('id, created_by, is_personal')
        .eq('id', id)
        .single();

      if (evErr || !ev) {
        return NextResponse.json({ success: false, error: 'Evento no encontrado' }, { status: 404 });
      }

      const isOwner = ev.created_by === currentUser.id;
      const isPersonal = ev.is_personal === true;

      if (!isOwner || !isPersonal) {
        return NextResponse.json(
          { success: false, error: 'No tienes permisos para eliminar este evento' },
          { status: 403 }
        );
      }
    }

    const success = await calendarService.deleteEvent(id);

    return NextResponse.json({ success });
  } catch (error: unknown) {
    console.error('Error deleting event:', error);
    const message = error instanceof Error ? error.message : 'Error al eliminar evento';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
