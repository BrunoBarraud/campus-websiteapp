import React from 'react';
import { CalendarEvent, CreateEventForm, Subject, EventType, User } from '@/app/lib/types';

interface EventModalProps {
  showEventModal: boolean;
  setShowEventModal: (show: boolean) => void;
  editingEvent: CalendarEvent | null;
  setEditingEvent: (event: CalendarEvent | null) => void;
  eventForm: CreateEventForm;
  setEventForm: (form: CreateEventForm) => void;
  handleCreateEvent: () => void;
  handleEditEvent: () => void;
  resetEventForm: () => void;
  userSubjects: Subject[];
  currentUser: User | null;
  personalOnly?: boolean;
}

const EventModal: React.FC<EventModalProps> = ({
  showEventModal,
  setShowEventModal,
  editingEvent,
  setEditingEvent,
  eventForm,
  setEventForm,
  handleCreateEvent,
  handleEditEvent,
  resetEventForm,
  userSubjects,
  currentUser,
  personalOnly = false
}) => {
  if (!showEventModal) return null;
  return (
    <div className="fixed inset-0 bg-rose-950/90 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in border-4 border-amber-400">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-rose-950 bg-amber-400 px-2 py-1 rounded-lg shadow-lg inline-block">{editingEvent ? 'Editar Evento' : 'Nuevo Evento'}</h3>
              <button
                className="text-amber-400 hover:text-rose-950 transition-colors rounded-full p-1 bg-rose-950/10"
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                  resetEventForm();
                }}
                aria-label="Cerrar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <label className="block text-sm font-medium text-rose-950 mb-2">Visibilidad *</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="visibility"
                    checked={personalOnly ? true : !!eventForm.is_personal}
                    onChange={() => {
                      setEventForm({
                        ...eventForm,
                        is_personal: true,
                        is_global: false,
                        year: undefined,
                        subject_id: ''
                      });
                    }}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-rose-950">Personal (solo tú lo ves)</span>
                </label>

                {!personalOnly && (
                  <>
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
                      <span className="text-rose-950">Global (todos lo ven)</span>
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
                        <span className="text-rose-950">Por año</span>
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
                    <div className="flex flex-col sm:flex-row items-center gap-2">
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
                            <span className="text-rose-950">Por materia</span>
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
                            className="w-32 sm:w-40 px-2 py-1 border border-gray-300 rounded text-sm"
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
                  </>
                )}
              </div>
            </div>
            {/* Título */}
            <div>
              <label className="block text-sm font-medium text-rose-950 mb-1">Título *</label>
              <input
                type="text"
                required
                value={eventForm.title}
                onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                className="w-full px-3 py-2 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-rose-50 text-rose-950"
              />
            </div>
            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-rose-950 mb-1">Fecha *</label>
                <input
                  type="date"
                  required
                  value={eventForm.date}
                  onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-rose-50 text-rose-950"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-rose-950 mb-1">Hora</label>
                <input
                  type="time"
                  value={eventForm.time}
                  onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
                  className="w-full px-3 py-2 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-rose-50 text-rose-950"
                />
              </div>
            </div>
            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-rose-950 mb-1">Tipo *</label>
              <select
                required
                value={eventForm.type}
                onChange={(e) => setEventForm({...eventForm, type: e.target.value as EventType})}
                className="w-full px-3 py-2 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-rose-50 text-rose-950"
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
                <label className="block text-sm font-medium text-rose-950 mb-1">Materia</label>
                <select
                  value={eventForm.subject_id}
                  onChange={(e) => setEventForm({...eventForm, subject_id: e.target.value})}
                  className="w-full px-3 py-2 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-rose-50 text-rose-950"
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
              <label className="block text-sm font-medium text-rose-950 mb-1">Descripción</label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-amber-400 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-rose-50 text-rose-950"
              />
            </div>
            {/* Acciones */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEventModal(false);
                  setEditingEvent(null);
                  resetEventForm();
                }}
                className="px-4 py-2 border border-amber-400 rounded-lg bg-rose-950 text-amber-400 hover:bg-amber-400 hover:text-rose-950 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-400 text-rose-950 rounded-lg hover:bg-rose-950 hover:text-amber-400 transition-colors font-semibold border-2 border-rose-950"
              >
                {editingEvent ? 'Actualizar' : 'Crear Evento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventModal;
