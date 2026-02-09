// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React from 'react';
import Calendar from '../../../components/calendar/Calendar';

const CalendarPage = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Calendario Académico</h1>
          <p className="text-slate-600">
            Mantente al día con fechas importantes, exámenes, entregas y eventos académicos.
          </p>
        </header>

        {/* Calendar Component */}
        <div className="mb-8">
          <Calendar />
        </div>

      </div>
    </div>
  );
};

export default CalendarPage;
