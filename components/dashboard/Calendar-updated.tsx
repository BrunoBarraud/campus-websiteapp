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
    subject_id: undefined,
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

      // Cargar materias del usuario
      const subjects = await subjectService.getSubjects(user.role, user.id, user.year || undefined);
      setUserSubjects(subjects);

      // Obtener lista de subjectIds para el usuario
      const subjectIds = subjects.map(s => s.id);

      // Cargar eventos del calendario con filtrado por materias
      const userEvents = await calendarService.getEvents(
        user.role,
        user.id,
        user.year || undefined,
        undefined,
        subjectIds
      );
      setCalendarEvents(userEvents);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Usar únicamente los eventos cargados desde el servicio (no usar datos mock)
  const displayEvents = calendarEvents;

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

    // Corregir subject_id vacío para que sea null
    const safeEventForm = {
      ...eventForm,
      subject_id: eventForm.subject_id === '' ? undefined : eventForm.subject_id
    };

    try {
      const newEvent = await calendarService.createEvent(safeEventForm, currentUser.id);
      if (newEvent) {
        setCalendarEvents([...calendarEvents, newEvent]);
        setShowEventModal(false);
        resetEventForm();
        if (onEventCreate) onEventCreate(safeEventForm);
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

    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-4 mb-4 sm:mb-0">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg sm:text-2xl font-bold" id="month-year">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-blue-700 transition-colors">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {canUserEdit() && (
            <button onClick={() => openEventModal()} className="px-3 py-2 sm:px-4 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center text-sm sm:text-base w-full sm:w-auto justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">Nuevo Evento</span>
              <span className="sm:hidden">+ Evento</span>
            </button>
          )}
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
        {dayNames.map(day => (
          <div key={day} className="p-1 sm:p-3 text-center text-xs sm:text-sm font-semibold text-gray-600">{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {/* Espacios en blanco para los días antes del primer día del mes */}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[60px] sm:min-h-[100px]"></div>
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
              className={`calendar-day bg-white min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 border border-gray-100 cursor-pointer transition-all ${isToday ? 'bg-blue-50 border-blue-200' : ''} ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
              onClick={() => setSelectedDate(selectedDate === dateString ? null : dateString)}
              onDoubleClick={() => canUserEdit() && openEventModal(dateString)}
            >
              <div className={`day-number text-xs sm:text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</div>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`event-preview text-xs p-1 rounded text-white truncate cursor-pointer ${getEventTypeColor(event.type)}`}
                    title={event.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canUserEdit()) openEventModal(undefined, event);
                    }}
                  >
                    <span className="hidden sm:inline">{event.title}</span>
                    <span className="sm:hidden">•</span>
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
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 space-y-2 sm:space-y-0">
            <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
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
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 w-full sm:w-auto"
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
                    <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                      <button
                        onClick={() => openEventModal(undefined, event)}
                        className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</h3>
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => {
                    setShowEventModal(false);
                    setEditingEvent(null);
                    resetEventForm();
                  }}
                  aria-label="Cerrar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (editingEvent) {
                  handleEditEvent();
                } else {
                  handleCreateEvent();
                }
              }} className="space-y-4">
                {/* Selector de visibilidad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibilidad *</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="visibility"
                        checked={!!eventForm.is_personal}
                        onChange={() => setEventForm({
                          ...eventForm,
                          is_personal: true,
                          is_global: false,
                          year: undefined,
                          subject_id: ''
                        })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Personal (solo tú lo ves)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="visibility"
                        checked={!!eventForm.is_global}
                        onChange={() => setEventForm({
                          ...eventForm,
                          is_personal: false,
                          is_global: true,
                          year: undefined,
                          subject_id: ''
                        })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Global (todos lo ven)</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="visibility"
                          checked={!eventForm.is_personal && !eventForm.is_global && !!eventForm.year}
                          onChange={() => setEventForm({
                            ...eventForm,
                            is_personal: false,
                            is_global: false,
                            year: currentUser?.year || 1,
                            subject_id: ''
                          })}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>Por año</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={6}
                        value={eventForm.year || ''}
                        onChange={e => setEventForm({
                          ...eventForm,
                          year: Number(e.target.value),
                          is_personal: false,
                          is_global: false,
                          subject_id: ''
                        })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                        disabled={!eventForm.year}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      {userSubjects.length > 0 && (
                        <>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="visibility"
                              checked={!eventForm.is_personal && !eventForm.is_global && !!eventForm.subject_id}
                              onChange={() => setEventForm({
                                ...eventForm,
                                is_personal: false,
                                is_global: false,
                                year: undefined,
                                subject_id: userSubjects[0].id
                              })}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>Por materia</span>
                          </label>
                          <select
                            value={eventForm.subject_id}
                            onChange={e => setEventForm({
                              ...eventForm,
                              subject_id: e.target.value,
                              is_personal: false,
                              is_global: false,
                              year: undefined
                            })}
                            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm"
                            disabled={!eventForm.subject_id}
                          >
                            {userSubjects.map(subject => (
                              <option key={subject.id} value={subject.id}>
                                {subject.name} ({subject.year}° año)
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {/* Título */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                {/* Fecha y hora */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                    <input
                      type="date"
                      required
                      value={eventForm.date}
                      onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Hora</label>
                    <input
                      type="time"
                      value={eventForm.time}
                      onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
                {/* Tipo */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    required
                    value={eventForm.type}
                    onChange={(e) => setEventForm({...eventForm, type: e.target.value as EventType})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="class">Clase</option>
                    <option value="exam">Examen</option>
                    <option value="assignment">Tarea/TP</option>
                    <option value="meeting">Reunión</option>
                    <option value="holiday">Feriado</option>
                  </select>
                </div>
                {/* Materia */}
                {userSubjects.length > 0 && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Materia</label>
                    <select
                      value={eventForm.subject_id}
                      onChange={(e) => setEventForm({...eventForm, subject_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                {/* Descripción */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                {/* Acciones */}
                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventModal(false);
                      setEditingEvent(null);
                      resetEventForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm w-full sm:w-auto"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm w-full sm:w-auto"
                  >
                    {editingEvent ? 'Actualizar' : 'Crear Evento'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm mt-4 sm:mt-6">
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-2"></span>
            <span className="text-gray-700">Exámenes</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block mr-2"></span>
            <span className="text-gray-700">Tareas</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block mr-2"></span>
            <span className="text-gray-700">Clases</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>
            <span className="text-gray-700">Feriados</span>
          </div>
          <div className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block mr-2"></span>
            <span className="text-gray-700">Reuniones</span>
          </div>
        </div>
        {currentUser && (
          <div className="sm:ml-auto flex items-center text-gray-600 mt-2 sm:mt-0">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <span>Rol: <span className="font-medium">{currentUser.role === 'admin' ? 'Administrador' : currentUser.role === 'teacher' ? 'Profesor' : 'Estudiante'}</span></span>
              {canUserEdit() && <span className="text-green-600 sm:ml-2">• Puedes editar</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
