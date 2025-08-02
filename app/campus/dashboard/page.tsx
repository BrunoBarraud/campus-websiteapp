"use client";

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = "force-dynamic";

import CampusLayout from "@/components/layouts/CampusLayout";
import CampusDashboard from "@/components/campus/CampusDashboard";

const DashboardPage = () => {
  return (
    <CampusLayout>
      <CampusDashboard />
    </CampusLayout>
  );
};

export default DashboardPage;
