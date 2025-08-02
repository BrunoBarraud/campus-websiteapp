'use client';

// Forzar todo el campus como dinámico
export const dynamic = 'force-dynamic';

export default function CampusLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
