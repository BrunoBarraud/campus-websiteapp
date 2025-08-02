"use client";

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = "force-dynamic";

import CampusDashboard from '@/components/campus/CampusDashboard';

const DashboardPage = () => {
  return <CampusDashboard />;
};

export default DashboardPage;
