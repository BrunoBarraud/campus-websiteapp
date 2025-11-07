import React from 'react';
import { EventType, CalendarEvent } from '@/app/lib/types';

interface CalendarGridProps {
  currentDate: Date;
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
  getEventsForDate: (dateString: string) => CalendarEvent[];
  getEventTypeColor: (type: EventType) => string;
  canUserEdit: () => boolean;
  openEventModal: (date?: string, event?: CalendarEvent) => void;
  monthNames: string[];
  dayNames: string[];
  nextMonth: () => void;
  prevMonth: () => void;
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  selectedDate,
  setSelectedDate,
  getEventsForDate,
  getEventTypeColor,
  canUserEdit,
  openEventModal,
  monthNames,
  dayNames,
  nextMonth,
  prevMonth
}) => {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  return (
    <>
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-rose-950 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-4 mb-4 sm:mb-0">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold" id="month-year">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          {canUserEdit() && (
            <button onClick={() => openEventModal()} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Evento
            </button>
          )}
        </div>
      </div>
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-200">
        {dayNames.map(day => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-600">{day}</div>
        ))}
      </div>
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="bg-white min-h-[100px]"></div>
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = getEventsForDate(dateString);
          const isToday = dateString === new Date().toISOString().split('T')[0];
          const isSelected = selectedDate === dateString;
          return (
            <div
              key={day}
              className={`calendar-day bg-white min-h-[100px] p-2 border border-gray-100 cursor-pointer transition-all ${isToday ? 'bg-blue-50 border-blue-200' : ''} ${isSelected ? 'bg-blue-100 border-blue-300' : ''}`}
              onClick={() => setSelectedDate(selectedDate === dateString ? null : dateString)}
              onDoubleClick={() => canUserEdit() && openEventModal(dateString)}
            >
              <div className={`day-number text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>{day}</div>
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
    </>
  );
};

export default CalendarGrid;
