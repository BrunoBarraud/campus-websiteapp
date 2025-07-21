'use client';
import dynamic from 'next/dynamic';
import React from 'react';

const DashboardLayout = dynamic(() => import('./DashboardLayout'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-rose-950 to-yellow-500 flex items-center justify-center">
      <div className="text-white">Cargando...</div>
    </div>
  ),
});

export default function DynamicDashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
