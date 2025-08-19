// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React from 'react';
import Calendar from '../../../components/calendar/Calendar';

const CalendarPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Calendario Académico</h1>
          <p className="text-gray-600">
            Mantente al día con fechas importantes, exámenes, entregas y eventos académicos.
          </p>
        </header>

        {/* Calendar Component */}
        <div className="mb-8">
          <Calendar />
        </div>

      </div>
  );
};

export default CalendarPage;
