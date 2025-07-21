'use client';

// Forzar todo el campus como dinámico
export const dynamic = 'force-dynamic';

import DynamicDashboardLayout from "@/components/dashboard/DynamicDashboardLayout";

export default function CampusLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DynamicDashboardLayout>{children}</DynamicDashboardLayout>;
}
