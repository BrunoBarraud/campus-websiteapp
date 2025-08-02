// 📅 API para gestionar eventos específicos del calendario
import { NextResponse } from 'next/server';
import { calendarService } from '@/app/lib/services';
import { CreateEventForm } from '@/lib/types';
import { requireRole } from '@/app/lib/permissions';

// PUT - Actualizar evento
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventData: Partial<CreateEventForm> = await request.json();
    const eventId = params.id;

    // Get authenticated user
    const currentUser = await requireRole(['admin', 'teacher', 'student']);

    // Obtener el evento actual para verificar permisos
    const currentEvents = await calendarService.getEvents(
      currentUser.role, 
      currentUser.id, 
      currentUser.year || undefined
    );
    
    const eventToEdit = currentEvents.find(e => e.id === eventId);
    
    if (!eventToEdit) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos de edición
    const canEdit = eventToEdit.created_by === currentUser.id || currentUser.role === 'admin';
    
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para editar este evento' },
        { status: 403 }
      );
    }

    // Validar permisos de visibilidad según el rol (similar a POST)
    if (currentUser.role === 'student' && eventData.visibility !== 'private') {
      return NextResponse.json(
        { success: false, error: 'Los estudiantes solo pueden crear eventos personales (privados)' },
        { status: 403 }
      );
    }

    const updatedEvent = await calendarService.updateEvent(eventId, eventData);

    if (!updatedEvent) {
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el evento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: updatedEvent
    });

  } catch (error: unknown) {
    console.error('Error updating event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar evento';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar evento
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const eventId = params.id;

    // Get authenticated user
    const currentUser = await requireRole(['admin', 'teacher', 'student']);

    // Obtener el evento actual para verificar permisos
    const currentEvents = await calendarService.getEvents(
      currentUser.role, 
      currentUser.id, 
      currentUser.year || undefined
    );
    
    const eventToDelete = currentEvents.find(e => e.id === eventId);
    
    if (!eventToDelete) {
      return NextResponse.json(
        { success: false, error: 'Evento no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos de eliminación
    const canDelete = eventToDelete.created_by === currentUser.id || currentUser.role === 'admin';
    
    if (!canDelete) {
      return NextResponse.json(
        { success: false, error: 'No tienes permisos para eliminar este evento' },
        { status: 403 }
      );
    }

    const deleted = await calendarService.deleteEvent(eventId);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Error al eliminar el evento' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });

  } catch (error: unknown) {
    console.error('Error deleting event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar evento';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
