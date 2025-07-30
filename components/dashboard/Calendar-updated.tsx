'use client'

import React, { useState, useEffect } from 'react';
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

const Calendar: React.FC<CalendarProps> = ({ 
  events = [], 
  canEdit = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  userYear,
  onEventCreate,
  onEventEdit,
  onEventDelete 
}) => {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(events);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userSubjects, setUserSubjects] = useState<Subject[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  // 🎯 Formulario para crear/editar eventos
  const [eventForm, setEventForm] = useState<CreateEventForm>({
    title: '',
    description: '',
    date: '',
    time: '',
    type: 'class',
    subject_id: '',
    year: userYear
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (session?.user) {
      loadInitialData();
    }
  }, [session]);

  const loadInitialData = async () => {
    if (!session?.user) return;
    
    try {
      setLoading(true);
      
      // Usar usuario de la sesión
      const user = session.user as User;
      setCurrentUser(user);

      // Cargar eventos del calendario
      const userEvents = await calendarService.getEvents(user.role, user.id, user.year || undefined);
      setCalendarEvents(userEvents);

      // Cargar materias del usuario
      const subjects = await subjectService.getSubjects(user.role, user.id, user.year || undefined);
      setUserSubjects(subjects);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Eventos de ejemplo si no se proporcionan y no hay usuario
  const defaultEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Examen de Matemática',
      date: '2025-07-25',
      type: 'exam',
      description: 'Examen parcial - Unidades 1 y 2',
      is_active: true,
      created_at: '',
      updated_at: ''
    },
    {
      id: '2',
      title: 'Entrega de ensayo',
      date: '2025-07-28',
      type: 'assignment',
      description: 'Ensayo sobre literatura contemporánea',
      is_active: true,
      created_at: '',
      updated_at: ''
    },
    {
      id: '3',
      title: 'Práctica de laboratorio',
      date: '2025-07-30',
      type: 'class',
      description: 'Laboratorio de química orgánica',
      is_active: true,
      created_at: '',
      updated_at: ''
    },
    {
      id: '4',
      title: 'Día del Estudiante',
      date: '2025-09-21',
      type: 'holiday',
      description: 'Feriado nacional',
      is_active: true,
      created_at: '',
      updated_at: ''
    }
  ];

  const displayEvents = calendarEvents.length > 0 ? calendarEvents : defaultEvents;

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getEventsForDate = (dateString: string) => {
    return displayEvents.filter(event => event.date === dateString);
  };

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

  const canUserEdit = () => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || currentUser.role === 'teacher';
  };

  const handleCreateEvent = async () => {
    if (!currentUser || !canUserEdit()) return;

    try {
      const newEvent = await calendarService.createEvent(eventForm, currentUser.id);
      if (newEvent) {
        setCalendarEvents([...calendarEvents, newEvent]);
        setShowEventModal(false);
        resetEventForm();
        if (onEventCreate) onEventCreate(eventForm);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Error al crear el evento');
    }
  };

  const handleEditEvent = async () => {
    if (!editingEvent || !currentUser || !canUserEdit()) return;

    try {
      const updatedEvent = await calendarService.updateEvent(editingEvent.id, eventForm);
      if (updatedEvent) {
        setCalendarEvents(calendarEvents.map(event => 
          event.id === editingEvent.id ? updatedEvent : event
        ));
        setShowEventModal(false);
        setEditingEvent(null);
        resetEventForm();
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
      // Editar evento existente
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
      // Crear nuevo evento
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
      subject_id: '',
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

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);

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
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header del calendario */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-xl font-semibold text-gray-800">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>

        <div className="flex items-center space-x-2">
          {canUserEdit() && (
            <button
              onClick={() => openEventModal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              + Evento
            </button>
          )}
          
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {/* Espacios en blanco para los días antes del primer día del mes */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="h-24 p-1"></div>
        ))}

        {/* Días del mes */}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateString = formatDate(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dayEvents = getEventsForDate(dateString);
          const isToday = dateString === new Date().toISOString().split('T')[0];
          const isSelected = selectedDate === dateString;

          return (
            <div
              key={day}
              className={`h-24 p-1 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                isToday ? 'bg-blue-50 border-blue-200' : ''
              } ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
              onClick={() => setSelectedDate(selectedDate === dateString ? null : dateString)}
              onDoubleClick={() => canUserEdit() && openEventModal(dateString)}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                {day}
              </div>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded text-white truncate cursor-pointer ${getEventTypeColor(event.type)}`}
                    title={event.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canUserEdit()) openEventModal(undefined, event);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 2} más
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Eventos del día seleccionado */}
      {selectedDate && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">
              Eventos del {new Date(selectedDate).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            {canUserEdit() && (
              <button
                onClick={() => openEventModal(selectedDate)}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                + Agregar
              </button>
            )}
          </div>
          
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="space-y-2">
              {getEventsForDate(selectedDate).map(event => (
                <div key={event.id} className="flex items-start justify-between space-x-3">
                  <div className="flex items-start space-x-3">
                    <div className={`w-3 h-3 rounded-full mt-1 ${getEventTypeColor(event.type)}`}></div>
                    <div>
                      <div className="font-medium text-gray-800">{event.title}</div>
                      {event.subject && (
                        <div className="text-sm text-gray-600">{event.subject.name}</div>
                      )}
                      {event.description && (
                        <div className="text-sm text-gray-500 mt-1">{event.description}</div>
                      )}
                      {event.time && (
                        <div className="text-sm text-gray-500">{event.time}</div>
                      )}
                    </div>
                  </div>
                  {canUserEdit() && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEventModal(undefined, event)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay eventos para este día.</p>
          )}
        </div>
      )}

      {/* Modal para crear/editar eventos */}
      {showEventModal && canUserEdit() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingEvent ? 'Editar Evento' : 'Crear Nuevo Evento'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (editingEvent) {
                handleEditEvent();
              } else {
                handleCreateEvent();
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    value={eventForm.time}
                    onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    required
                    value={eventForm.type}
                    onChange={(e) => setEventForm({...eventForm, type: e.target.value as EventType})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="class">Clase</option>
                    <option value="exam">Examen</option>
                    <option value="assignment">Tarea/TP</option>
                    <option value="meeting">Reunión</option>
                    <option value="holiday">Feriado</option>
                  </select>
                </div>

                {userSubjects.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Materia
                    </label>
                    <select
                      value={eventForm.subject_id}
                      onChange={(e) => setEventForm({...eventForm, subject_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sin materia específica</option>
                      {userSubjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.year}° año)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                    resetEventForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingEvent ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-6 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Exámenes</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>Tareas</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Clases</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Feriados</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span>Reuniones</span>
        </div>
        {currentUser && (
          <div className="ml-auto text-gray-600">
            Rol: <span className="font-medium">{currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'teacher' ? 'Profesor' : 'Estudiante'}</span>
            {canUserEdit() && <span className="text-green-600 ml-2">• Puedes editar</span>}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
