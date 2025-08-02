"use client";

import React from 'react';
import CampusLayout from '@/components/layouts/CampusLayout';
import Calendar from '@/components/dashboard/Calendar';

export default function CalendarPage() {
  return (
    <CampusLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Calendario Académico
          </h1>
          <p className="text-gray-600">
            Gestiona tus horarios, eventos y fechas importantes
          </p>
        </div>

        {/* Calendar Component */}
        <Calendar canEdit={true} />
      </div>
    </CampusLayout>
  );
}
