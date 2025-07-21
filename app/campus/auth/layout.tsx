export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Este layout ahora es manejado por DashboardLayout
  return <>{children}</>;
}
