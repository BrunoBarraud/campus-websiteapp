// 📅 API para gestión de eventos del calendario
import { NextResponse } from 'next/server';
import { calendarService } from '@/app/lib/services';
import { CreateEventForm, EventType } from '@/app/lib/types';
import { requireRole } from '@/app/lib/permissions';

// GET - Obtener eventos según el rol del usuario
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const subjectId = searchParams.get('subject_id');
    const type = searchParams.get('type');
    const month = searchParams.get('month');

    // Get authenticated user using role-based authentication
    const currentUser = await requireRole(['admin', 'teacher', 'student']);
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const filter = {
      year: year ? parseInt(year) : undefined,
      subject_id: subjectId || undefined,
      type: type as EventType | undefined,
      month: month ? parseInt(month) : undefined
    };

    const events = await calendarService.getEvents(
      currentUser.role, 
      currentUser.id, 
      currentUser.year || undefined, 
      filter
    );

    return NextResponse.json({
      success: true,
      data: events
    });

  } catch (error: unknown) {
    console.error('Error getting events:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al obtener eventos';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo evento (admins y profesores)
export async function POST(request: Request) {
  try {
    const eventData: CreateEventForm = await request.json();

    // Get authenticated user using role-based authentication
    const currentUser = await requireRole(['admin', 'teacher']);

    // Verificar permisos
    if (currentUser.role === 'student') {
      return NextResponse.json(
        { success: false, error: 'Los estudiantes no pueden crear eventos' },
        { status: 403 }
      );
    }

    // Validar datos requeridos
    if (!eventData.title || !eventData.date || !eventData.type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Faltan campos requeridos: title, date, type' 
        },
        { status: 400 }
      );
    }

    // Validar fecha
    const eventDate = new Date(eventData.date);
    const today = new Date();
    if (eventDate < today) {
      return NextResponse.json(
        { success: false, error: 'No se pueden crear eventos en fechas pasadas' },
        { status: 400 }
      );
    }

    const newEvent = await calendarService.createEvent(eventData, currentUser.id);

    return NextResponse.json({
      success: true,
      message: 'Evento creado exitosamente',
      data: newEvent
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Error creating event:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear evento';
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
