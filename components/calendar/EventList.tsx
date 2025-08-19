import React from 'react';
import { CalendarEvent, User, EventType } from '@/app/lib/types';

interface EventListProps {
  selectedDate: string;
  getEventsForDate: (dateString: string) => CalendarEvent[];
  getEventTypeColor: (type: EventType) => string;
  canUserEdit: () => boolean;
  openEventModal: (date?: string, event?: CalendarEvent) => void;
  handleDeleteEvent: (eventId: string) => void;
  currentUser: User | null;
}

const EventList: React.FC<EventListProps> = ({
  selectedDate,
  getEventsForDate,
  getEventTypeColor,
  canUserEdit,
  openEventModal,
  handleDeleteEvent,
  currentUser
}) => {
  const events = getEventsForDate(selectedDate);
  return (
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
      {events.length > 0 ? (
        <div className="space-y-2">
          {events.map(event => (
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
  );
};

export default EventList;
