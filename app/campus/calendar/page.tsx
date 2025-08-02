// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React from 'react';
import Calendar from '../../../components/dashboard/Calendar';

const CalendarPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">📅 Calendario Académico</h1>
          <p className="text-gray-600">
            Mantente al día con fechas importantes, exámenes, entregas y eventos académicos.
            {' '}Los profesores y administradores pueden crear eventos que serán visibles para los estudiantes.
            {' '}Los estudiantes pueden crear eventos personales que solo ellos verán.
          </p>
        </header>

        {/* Calendar Component */}
        <div className="mb-8">
          <Calendar />
        </div>

        {/* Información sobre el sistema de eventos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">💡 Sistema de Eventos</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h3 className="text-lg font-medium text-gray-800 mb-2">👨‍🎓 Estudiantes</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Pueden crear eventos personales</li>
                <li>• Ven eventos creados por profesores</li>
                <li>• Ven feriados y eventos generales</li>
                <li>• Solo ellos ven sus eventos personales</li>
              </ul>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
              <h3 className="text-lg font-medium text-gray-800 mb-2">👨‍🏫 Profesores</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Pueden crear eventos para estudiantes</li>
                <li>• Pueden crear eventos personales</li>
                <li>• Ven todos los eventos públicos</li>
                <li>• Sus eventos aparecen a los estudiantes</li>
              </ul>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
              <h3 className="text-lg font-medium text-gray-800 mb-2">👨‍💼 Administradores</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Pueden crear cualquier tipo de evento</li>
                <li>• Ven la mayoría de eventos del sistema</li>
                <li>• Pueden gestionar feriados y eventos generales</li>
                <li>• Sus eventos son visibles según configuración</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  );
};

export default CalendarPage;
