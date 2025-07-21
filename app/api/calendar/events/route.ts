// 📅 API para gestión de eventos del calendario
import { NextResponse } from 'next/server';
import { calendarService, userService } from '@/app/lib/services';
import { CreateEventForm } from '@/app/lib/types';

// GET - Obtener eventos según el rol del usuario
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const subjectId = searchParams.get('subject_id');
    const type = searchParams.get('type');
    const month = searchParams.get('month');

    // Obtener usuario actual para determinar qué eventos mostrar
    const currentUser = await userService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const filter = {
      year: year ? parseInt(year) : undefined,
      subject_id: subjectId || undefined,
      type: type as any,
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

  } catch (error: any) {
    console.error('Error getting events:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al obtener eventos' 
      },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo evento (admins y profesores)
export async function POST(request: Request) {
  try {
    const eventData: CreateEventForm = await request.json();

    // Obtener usuario actual
    const currentUser = await userService.getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

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

  } catch (error: any) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error al crear evento' 
      },
      { status: 500 }
    );
  }
}
