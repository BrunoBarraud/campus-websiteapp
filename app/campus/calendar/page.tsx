import React from 'react';
import Calendar from '../../../components/dashboard/Calendar';

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

        {/* Próximos eventos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Próximos Eventos</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-800">Examen de Matemática</h3>
                <p className="text-gray-600">25 de Julio, 2025</p>
                <p className="text-sm text-gray-500">Unidades 1 y 2 - Prof. González, María</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-800">Entrega de Ensayo</h3>
                <p className="text-gray-600">28 de Julio, 2025</p>
                <p className="text-sm text-gray-500">Literatura contemporánea - Prof. Chiaretta, Luciana</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-800">Práctica de Laboratorio</h3>
                <p className="text-gray-600">30 de Julio, 2025</p>
                <p className="text-sm text-gray-500">Química orgánica - Prof. Martínez, Laura</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default CalendarPage;
