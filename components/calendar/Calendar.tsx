
'use client'

import React, { useMemo, useState, useEffect } from 'react';
import EventModal from './EventModal';
import { CalendarEvent, User, Subject, EventType, CreateEventForm } from '@/app/lib/types';
import { subjectService } from '@/app/lib/services';
import { useSession } from 'next-auth/react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  MoreVertical,
  Plus,
} from 'lucide-react';

interface CalendarProps {
  events?: CalendarEvent[];
  canEdit?: boolean;
  userYear?: number;
  onEventCreate?: (event: CreateEventForm) => void;
  onEventEdit?: (id: string, event: Partial<CalendarEvent>) => void;
  onEventDelete?: (id: string) => void;
}

type VisibilityFilter = 'all' | 'personal' | 'global' | 'year' | 'subject';

const Calendar: React.FC<CalendarProps> = ({ events = [], canEdit: _canEdit = false, userYear, onEventCreate, onEventEdit, onEventDelete }) => {
  const canCreateEvent = () => {
    if (!currentUser) return false;
    return currentUser.role === 'admin' || currentUser.role === 'teacher' || currentUser.role === 'student';
  };

  const canEditEvent = (ev?: CalendarEvent | null) => {
    if (!currentUser || !ev) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'teacher') return true;
    return currentUser.role === 'student' && ev.is_personal === true && ev.created_by === currentUser.id;
  };

  const canDeleteEvent = (ev?: CalendarEvent | null) => canEditEvent(ev);

  const handleCreateEvent = async () => {
    if (!currentUser || !canCreateEvent()) return;

    const safeEventForm: CreateEventForm = {
      ...eventForm,
      subject_id: !eventForm.subject_id ? undefined : eventForm.subject_id
    };

    if (currentUser.role === 'student') {
      safeEventForm.is_personal = true;
      safeEventForm.is_global = false;
      safeEventForm.year = undefined;
      safeEventForm.subject_id = undefined;
    }
    try {
      const res = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeEventForm),
      });

      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json.error || 'Error al crear el evento');
      }

      if (json.success && json.data) {
        setCalendarEvents([...calendarEvents, json.data]);
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
    } catch (error: any) {
      console.error('Error creating event:', error);
      alert(error.message || 'Error al crear el evento');
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
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');
  const [filterSubjectId, setFilterSubjectId] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<VisibilityFilter>('all');
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
    if (!editingEvent || !currentUser || !canEditEvent(editingEvent)) return;
    try {
      const safeEventForm = {
        ...eventForm,
        subject_id: !eventForm.subject_id ? undefined : eventForm.subject_id
      };

      if (currentUser.role === 'student') {
        safeEventForm.is_personal = true;
        safeEventForm.is_global = false;
        safeEventForm.year = undefined;
        safeEventForm.subject_id = undefined;
      }

      const res = await fetch(`/api/calendar/events/${editingEvent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safeEventForm),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Error al actualizar el evento');
      }

      if (json.success && json.data) {
        setCalendarEvents(calendarEvents.map(event => event.id === editingEvent.id ? json.data : event));
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
        if (onEventEdit) onEventEdit(editingEvent.id, json.data);
      }
    } catch (error: any) {
      console.error('Error updating event:', error);
      alert(error.message || 'Error al actualizar el evento');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    const ev = calendarEvents.find((e) => e.id === eventId);
    if (!currentUser || !canDeleteEvent(ev)) return;
    if (confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        const res = await fetch(`/api/calendar/events/${eventId}`, { method: 'DELETE' });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Error al eliminar el evento');
        }

        if (json.success) {
          setCalendarEvents(calendarEvents.filter(event => event.id !== eventId));
          if (onEventDelete) onEventDelete(eventId);
        }
      } catch (error: any) {
        console.error('Error deleting event:', error);
        alert(error.message || 'Error al eliminar el evento');
      }
    }
  };

  const openEventModal = (date?: string, event?: CalendarEvent) => {
    if (!currentUser) return;
    if (event) {
      if (!canEditEvent(event)) return;
    } else {
      if (!canCreateEvent()) return;
    }
    if (event) {
      setEditingEvent(event);
      setEventForm({
        title: event.title,
        description: event.description || '',
        date: event.date,
        time: event.time || '',
        type: event.type,
        subject_id: event.subject_id || '',
        year: event.year || userYear,
        is_personal: event.is_personal,
        is_global: event.is_global,
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
        year: userYear,
        is_personal: currentUser.role === 'student',
        is_global: false,
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

  
  const filteredEvents = useMemo(() => {
    return (calendarEvents || []).filter((ev) => {
      if (filterType !== 'all' && ev.type !== filterType) return false;
      if (filterSubjectId !== 'all' && (ev.subject_id || '') !== filterSubjectId) return false;

      switch (filterVisibility) {
        case 'personal':
          return !!currentUser?.id && ev.is_personal === true && ev.created_by === currentUser.id;
        case 'global':
          return ev.is_global === true;
        case 'year':
          return typeof currentUser?.year === 'number' && ev.year === currentUser.year;
        case 'subject':
          return !!ev.subject_id;
        case 'all':
        default:
          return true;
      }
    });
  }, [calendarEvents, currentUser?.id, currentUser?.year, filterSubjectId, filterType, filterVisibility]);

  const getEventsForDate = (dateString: string) => filteredEvents.filter(event => event.date === dateString);

  const getEventPillClass = (type: EventType) => {
    switch (type) {
      case 'assignment':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'holiday':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'exam':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'class':
        return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'meeting':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getEventDotClass = (type: EventType) => {
    switch (type) {
      case 'exam':
        return 'bg-rose-500';
      case 'assignment':
        return 'bg-blue-500';
      case 'holiday':
        return 'bg-emerald-500';
      case 'class':
        return 'bg-violet-500';
      case 'meeting':
        return 'bg-amber-500';
      default:
        return 'bg-indigo-500';
    }
  };

  const pad2 = (n: number) => String(n).padStart(2, '0');
  const formatDateString = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const todayString = formatDateString(new Date());

  useEffect(() => {
    if (session?.user) {
      loadInitialData();
    }
  }, [session]);

  const loadInitialData = async () => {
    if (!session?.user) {
      return;
    }
    try {
      setLoading(true);
      const user = session.user as User;
      setCurrentUser(user);
      const subjects = await subjectService.getSubjects(user.role, user.id, user.year || undefined);
      setUserSubjects(subjects);
      
      // Cargar eventos usando la API
      const res = await fetch('/api/calendar/events');
      const json = await res.json();
      if (json.success && json.data) {
        setCalendarEvents(json.data);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentMonthLabel = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstWeekDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const calendarCells = Array.from({ length: 42 }, (_, i) => {
    const dayNum = i - firstWeekDay + 1;
    if (dayNum <= 0 || dayNum > daysInMonth) return null;
    return dayNum;
  });

  const selectedDayNumber = selectedDate ? Number(selectedDate.split('-')[2]) : null;
  const selectedMonthLabel = selectedDate
    ? `${monthNames[Number(selectedDate.split('-')[1]) - 1]} ${selectedDate.split('-')[0]}`
    : currentMonthLabel;

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(formatDateString(now));
  };

  const openEventModalForSelected = () => {
    if (!selectedDate) {
      openEventModal();
      return;
    }
    openEventModal(selectedDate);
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterSubjectId('all');
    setFilterVisibility('all');
  };

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-slate-500">Cargando calendario...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {showEventModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[99] pointer-events-none transition-opacity duration-300" />
      )}

      <div className="flex flex-col lg:flex-row bg-slate-50 p-4 sm:p-6 gap-6 font-sans text-slate-800 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[560px] sm:min-h-[740px]">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                {currentMonthLabel} <CalendarIcon className="w-5 h-5 text-indigo-500" />
              </h2>
              <p className="text-slate-500 text-sm">Organiza tus exámenes y entregas</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button
                  onClick={prevMonth}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-4 text-sm font-bold text-slate-700"
                  type="button"
                >
                  Hoy
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 hover:bg-white hover:shadow-sm rounded-md transition-all text-slate-600"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                aria-label="Filtros"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filtros</span>
              </button>

              {canCreateEvent() && (
                <>
                  <button
                    type="button"
                    onClick={() => openEventModal()}
                    className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
                  >
                    <Plus className="w-5 h-5" /> Nuevo Evento
                  </button>
                  <button
                    type="button"
                    onClick={() => openEventModal()}
                    className="md:hidden inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white w-10 h-10 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    aria-label="Nuevo evento"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-b border-slate-100">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Tipo</label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    >
                      <option value="all">Todos</option>
                      <option value="class">Clase</option>
                      <option value="exam">Examen</option>
                      <option value="assignment">Tarea/TP</option>
                      <option value="meeting">Reunión</option>
                      <option value="holiday">Feriado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Materia</label>
                    <select
                      value={filterSubjectId}
                      onChange={(e) => setFilterSubjectId(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    >
                      <option value="all">Todas</option>
                      {userSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Visibilidad</label>
                    <select
                      value={filterVisibility}
                      onChange={(e) => setFilterVisibility(e.target.value as VisibilityFilter)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                    >
                      <option value="all">Todas</option>
                      <option value="global">Global</option>
                      <option value="personal">Personal</option>
                      <option value="year">Por año</option>
                      <option value="subject">Por materia</option>
                    </select>
                  </div>

                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="w-full bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 rounded-xl px-3 py-2 text-sm font-bold transition-colors"
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-slate-500">
                  Mostrando {filteredEvents.length} eventos
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
            {dayNames.map((day) => (
              <div key={day} className="py-3 text-center text-sm font-bold text-slate-500 uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 grid-rows-6 bg-slate-50/30">
            {calendarCells.map((day, idx) => {
              if (!day) {
                return (
                  <div
                    key={idx}
                    className="min-h-[72px] sm:min-h-[100px] border-b border-r border-slate-100 p-2 relative bg-slate-50/50"
                  />
                );
              }

              const dateString = `${currentDate.getFullYear()}-${pad2(currentDate.getMonth() + 1)}-${pad2(day)}`;
              const dayEvents = getEventsForDate(dateString);
              const isSelected = selectedDate === dateString;
              const isToday = dateString === todayString;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(dateString)}
                  onDoubleClick={() => canCreateEvent() && openEventModal(dateString)}
                  className={`
                    min-h-[72px] sm:min-h-[100px] border-b border-r border-slate-100 p-2 relative transition-all cursor-pointer group hover:bg-indigo-50/30
                    bg-white
                    ${isSelected ? 'ring-2 ring-inset ring-indigo-500 bg-indigo-50/20 z-10' : ''}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`
                        text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                        ${isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-700 group-hover:text-indigo-600'}
                      `}
                    >
                      {day}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded truncate border ${getEventPillClass(ev.type)}`}
                        title={ev.title}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(dateString);
                          if (canEditEvent(ev)) openEventModal(undefined, ev);
                        }}
                      >
                        <span className="hidden sm:inline">{ev.time ? ev.time : 'Todo el día'} • </span>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-slate-400 pl-1">+ {dayEvents.length - 3} más</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-full lg:w-96 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[560px] sm:min-h-[740px]">
          <div className="p-4 sm:p-6 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10" />

            <h3 className="text-4xl font-bold mb-1 relative z-10">{selectedDayNumber ?? '—'}</h3>
            <p className="text-indigo-200 font-medium relative z-10 text-lg">{selectedMonthLabel}</p>

            <div className="mt-4 flex gap-2">
              <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium border border-white/10">
                {selectedEvents.length} Eventos
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {selectedDate ? (
              selectedEvents.length > 0 ? (
                selectedEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="group relative pl-4 border-l-2 border-slate-200 hover:border-indigo-500 transition-colors"
                  >
                    <div
                      className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${getEventDotClass(ev.type)}`}
                    />

                    <div className="mb-1 flex justify-between items-start gap-2">
                      <h4
                        className="font-bold text-slate-800 text-lg group-hover:text-indigo-700 transition-colors cursor-pointer"
                        onClick={() => {
                          if (canEditEvent(ev)) openEventModal(undefined, ev);
                        }}
                      >
                        {ev.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {canEditEvent(ev) && (
                          <button
                            type="button"
                            className="text-slate-300 hover:text-slate-500"
                            aria-label="Más opciones"
                            onClick={() => {
                              if (canEditEvent(ev)) openEventModal(undefined, ev);
                            }}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm text-slate-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{ev.time ? ev.time : 'Todo el día'}</span>
                      </div>
                      {ev.subject?.name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span>{ev.subject.name}</span>
                        </div>
                      )}
                      {ev.description && <div className="text-slate-500">{ev.description}</div>}
                    </div>

                    {canEditEvent(ev) && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                          onClick={() => openEventModal(undefined, ev)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="text-rose-600 hover:text-rose-800 text-sm font-medium"
                          onClick={() => handleDeleteEvent(ev.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-50">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CalendarIcon className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400">No hay eventos para este día.</p>
                  <p className="text-xs text-slate-300 mt-1">¡Aprovechá para descansar!</p>
                </div>
              )
            ) : (
              <div className="text-center py-10 opacity-50">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CalendarIcon className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400">Elegí un día para ver detalles.</p>
              </div>
            )}
          </div>

          {canCreateEvent() && (
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
              <button
                type="button"
                onClick={openEventModalForSelected}
                className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 hover:border-indigo-500 hover:text-indigo-600 text-slate-700 py-3 rounded-xl font-bold transition-all shadow-sm"
              >
                <Plus className="w-5 h-5" /> Agregar al día {selectedDayNumber ?? ''}
              </button>
            </div>
          )}
        </div>

        {canCreateEvent() && !showEventModal && (
          <button
            type="button"
            onClick={() => openEventModal(selectedDate ?? undefined)}
            className="md:hidden fixed bottom-6 right-6 z-[90] inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-2xl shadow-2xl shadow-indigo-300/40 active:scale-95 transition-transform"
            aria-label="Nuevo evento"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {showEventModal && (
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
            personalOnly={currentUser?.role === 'student'}
          />
        )}
      </div>
    </div>
  );
}

export default Calendar;
