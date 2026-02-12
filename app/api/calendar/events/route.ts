// 📅 API para gestión de eventos del calendario
import { NextResponse } from 'next/server';
import { calendarService, subjectService } from '@/app/lib/services';
import { CreateEventForm, EventType } from '@/app/lib/types';
import { requireRole } from '@/app/lib/auth';
import { canStudentAct } from '@/app/lib/auth/checkApproval';

// GET - Obtener eventos según el rol del usuario
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const subjectId = searchParams.get('subject_id');
    const type = searchParams.get('type');
    const month = searchParams.get('month');

    // Get authenticated user using role-based authentication
    let currentUser;
    try {
      currentUser = await requireRole(['admin', 'admin_director', 'teacher', 'student']);
    } catch (authErr: unknown) {
      console.warn('Authentication/authorization failed when getting events:', authErr);
      const msg = authErr instanceof Error ? authErr.message : 'No autenticado';
      return NextResponse.json({ success: false, error: msg }, { status: 401 });
    }

    const filter = {
      year: year ? parseInt(year) : undefined,
      subject_id: subjectId || undefined,
      type: type as EventType | undefined,
      month: month ? parseInt(month) : undefined
    };

    const subjects = await subjectService.getSubjects(
      currentUser.role,
      currentUser.id,
      currentUser.year || undefined
    );
    const subjectIds = (subjects || []).map((s) => s.id);

    const events = await calendarService.getEvents(
      currentUser.role,
      currentUser.id,
      currentUser.year || undefined,
      filter,
      subjectIds
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
    const currentUser = await requireRole(['admin', 'admin_director', 'teacher', 'student']);

    // Verificar permisos
    if (currentUser.role === 'student') {
      // Verificar que el estudiante esté aprobado
      const canAct = await canStudentAct(currentUser.id);
      if (!canAct) {
        return NextResponse.json(
          { success: false, error: 'Tu cuenta está pendiente de aprobación. No podés crear eventos.' },
          { status: 403 }
        );
      }

      const isPersonal = eventData.is_personal === true;
      const isGlobal = eventData.is_global === true;
      const hasYear = typeof eventData.year === 'number' && !Number.isNaN(eventData.year);
      const hasSubject = !!eventData.subject_id;

      if (!isPersonal || isGlobal || hasYear || hasSubject) {
        return NextResponse.json(
          { success: false, error: 'Los estudiantes solo pueden crear eventos personales' },
          { status: 403 }
        );
      }
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

    // Validar fecha (permitir eventos del día actual)
    const eventDate = new Date(eventData.date + 'T23:59:59');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
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
