'use client'

import React, { useState, useEffect } from 'react';
import CalendarGrid from './CalendarGrid';
import EventModal from './EventModal';
import EventList from './EventList';
import { CalendarEvent, User, Subject, EventType, CreateEventForm } from '@/app/lib/types';
import { calendarService, subjectService } from '@/app/lib/services';
import { useSession } from 'next-auth/react';

interface CalendarProps {
  events?: CalendarEvent[];
  canEdit?: boolean;
  userYear?: number;
  onEventCreate?: (event: CreateEventForm) => void;
  onEventEdit?: (id: string, event: Partial<CalendarEvent>) => void;
  onEventDelete?: (id: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events = [], canEdit: _canEdit = false, userYear, onEventCreate, onEventEdit, onEventDelete }) => {
  const canUserEdit = () => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || currentUser.role === 'teacher';
  };

  const handleCreateEvent = async () => {
    if (!currentUser || !canUserEdit()) return;
    const safeEventForm = {
      ...eventForm,
      subject_id: !eventForm.subject_id ? undefined : eventForm.subject_id
    };
    try {
      const newEvent = await calendarService.createEvent(safeEventForm, currentUser.id);
      if (newEvent) {
        setCalendarEvents([...calendarEvents, newEvent]);
        setShowEventModal(false);
        setEventForm({
          title: '',
          description: '',
          date: '',
          time: '',
          type: 'class',
          subject_id: undefined,
          year: userYear
        });
        if (onEventCreate) onEventCreate(safeEventForm);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error al crear el evento');
    }
  };
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(events);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userSubjects, setUserSubjects] = useState<Subject[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventForm, setEventForm] = useState<CreateEventForm>({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'class',
    subject_id: undefined,
    year: userYear
  });

  const handleEditEvent = async () => {
    if (!editingEvent || !currentUser || !canUserEdit()) return;
    try {
      const safeEventForm = {
        ...eventForm,
        subject_id: !eventForm.subject_id ? undefined : eventForm.subject_id
      };
      const updatedEvent = await calendarService.updateEvent(editingEvent.id, safeEventForm);
      if (updatedEvent) {
        setCalendarEvents(calendarEvents.map(event => event.id === editingEvent.id ? updatedEvent : event));
        setShowEventModal(false);
        setEditingEvent(null);
        setEventForm({
          title: '',
          description: '',
          date: '',
          time: '',
          type: 'class',
          subject_id: undefined,
          year: userYear
        });
        if (onEventEdit) onEventEdit(editingEvent.id, updatedEvent);
      }
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Error al actualizar el evento');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!currentUser || !canUserEdit()) return;
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        const success = await calendarService.deleteEvent(eventId);
        if (success) {
          setCalendarEvents(calendarEvents.filter(event => event.id !== eventId));
          if (onEventDelete) onEventDelete(eventId);
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error al eliminar el evento');
      }
    }
  };

  const openEventModal = (date?: string, event?: CalendarEvent) => {
    if (!canUserEdit()) return;
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description || '',
        date: event.date,
        time: event.time || '',
        type: event.type,
        subject_id: event.subject_id || '',
        year: event.year || userYear
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        title: '',
        description: '',
        date: date || selectedDate || '',
        time: '',
        type: 'class',
        subject_id: '',
        year: userYear
      });
    }
    setShowEventModal(true);
  };

  const resetEventForm = () => {
    setEventForm({
      title: '',
      description: '',
      date: '',
      time: '',
      type: 'class',
      subject_id: undefined,
      year: userYear
    });
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  
  const getEventsForDate = (dateString: string) => calendarEvents.filter(event => event.date === dateString);
  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case 'exam': return 'bg-red-500';
      case 'assignment': return 'bg-yellow-500';
      case 'class': return 'bg-blue-500';
      case 'holiday': return 'bg-green-500';
      case 'meeting': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  useEffect(() => {
    console.log('useEffect: session', session);
    if (session?.user) {
      console.log('Cargando datos iniciales para usuario:', session.user);
      loadInitialData();
    } else {
      console.warn('No hay usuario en sesión, no se carga el calendario');
    }
  }, [session]);

  const loadInitialData = async () => {
    if (!session?.user) {
      console.warn('No hay usuario en sesión en loadInitialData');
      return;
    }
    try {
      setLoading(true);
      const user = session.user as User;
      setCurrentUser(user);
      console.log('Obteniendo materias para usuario:', user);
      const subjects = await subjectService.getSubjects(user.role, user.id, user.year || undefined);
      setUserSubjects(subjects);
      const subjectIds = subjects.map(s => s.id);
      console.log('Obteniendo eventos para usuario:', user.role, user.id, user.year, subjectIds);
      const userEvents = await calendarService.getEvents(
        user.role,
        user.id,
        user.year || undefined,
        undefined,
        subjectIds
      );
      console.log('Eventos obtenidos:', userEvents);
      setCalendarEvents(userEvents);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Cargando calendario...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-white rounded-xl shadow-xl overflow-hidden">
      {/* Overlay para oscurecer el calendario */}
      {showEventModal && (
        <div className="absolute inset-0 bg-rose-950/70 z-[99] pointer-events-none transition-opacity duration-300" />
      )}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <div className="min-w-[720px] sm:min-w-0 px-4 sm:px-0">
          <CalendarGrid
            currentDate={currentDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            getEventsForDate={getEventsForDate}
            getEventTypeColor={getEventTypeColor}
            canUserEdit={canUserEdit}
            openEventModal={openEventModal}
            monthNames={monthNames}
            dayNames={dayNames}
            nextMonth={nextMonth}
            prevMonth={prevMonth}
          />
        </div>
      </div>
      {/* Eventos del día seleccionado */}
      {selectedDate && (
        <EventList
          selectedDate={selectedDate}
          getEventsForDate={getEventsForDate}
          getEventTypeColor={getEventTypeColor}
          canUserEdit={canUserEdit}
          openEventModal={openEventModal}
          handleDeleteEvent={handleDeleteEvent}
          currentUser={currentUser}
        />
      )}
      {/* Modal para crear/editar eventos */}
      {showEventModal && canUserEdit() && (
        <EventModal
          showEventModal={showEventModal}
          setShowEventModal={setShowEventModal}
          editingEvent={editingEvent}
          setEditingEvent={setEditingEvent}
          eventForm={eventForm}
          setEventForm={setEventForm}
          handleCreateEvent={handleCreateEvent}
          handleEditEvent={handleEditEvent}
          resetEventForm={resetEventForm}
          userSubjects={userSubjects}
          currentUser={currentUser}
        />
      )}
      {/* Leyenda */}
      {/* ...existing code... */}
    </div>
  );
}

export default Calendar;
