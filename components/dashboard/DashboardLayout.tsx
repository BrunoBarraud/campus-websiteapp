"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // No mostrar dashboard en páginas de autenticación
  const isAuthPage = pathname?.includes("/auth/");

  const baseNavigation = [
    { name: "Cursos", href: "/campus/dashboard", icon: "🏠" },
    { name: "Calendario", href: "/campus/calendar", icon: "📅" },
    // { name: "Mensajería", href: "/campus/mensajeria", icon: <i className="fas fa-comments"></i> },
    { name: "Perfil", href: "/campus/profile", icon: "👤" },
    { name: "Notificaciones", href: "/campus/notifications", icon: "🔔" },
  ];

  // Navegación extendida con Configuración (para admin) y Salir al final
  const navigation = [
    ...baseNavigation,
    ...(session?.user?.role === "admin"
      ? [{ name: "Configuración", href: "/campus/settings", icon: "⚙️" }]
      : []),
    { name: "Salir", href: "#logout", icon: "🚪" },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Sidebar Component
  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="h-full bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col">
      <nav className="mt-6 flex-1">
        <div className="px-3 space-y-1">
          {navigation.map((item) => {
            const isLogoutItem = item.name === "Salir";

            if (isLogoutItem) {
              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors text-gray-700 hover:bg-red-50 hover:text-red-700"
                >
                  <span className="mr-3 text-lg">{typeof item.icon === 'string' ? item.icon : item.icon}</span>
                  {item.name}
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center justify-between px-3 py-2.5 text-sm font-semibold rounded-xl transition-all border ${
                  pathname === item.href
                    ? "bg-yellow-50 text-gray-900 border-yellow-200"
                    : "text-gray-700 border-transparent hover:bg-yellow-50/60 hover:border-yellow-100"
                }`}
              >
                <span className="flex items-center min-w-0">
                  <span className="mr-3 text-lg">{typeof item.icon === 'string' ? item.icon : item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );

  // Si es una página de auth, renderizar solo el contenido sin layout
  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-rose-950 to-yellow-500 flex items-center justify-center p-2 sm:p-4 lg:p-6">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted">
      {/* Sidebar Drawer (Mobile & Tablet) */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="w-64">
            <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
          </div>
          <div
            className="flex-grow bg-black bg-opacity-50"
            onClick={() => setIsSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Static Sidebar (Desktop) */}
        <aside className="hidden lg:block w-72 sticky top-0 h-screen">
          <Sidebar />
        </aside>

        {/* Main content area */}
        <main className="flex-1 bg-white">
          {/* Proveedor de notificaciones de seguridad */}
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 pb-24 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border z-50 shadow-soft shadow-[0_-4px_16px_rgba(0,0,0,0.16)] pb-safe">
        <div className="flex items-center justify-around py-1 sm:py-2">
          {navigation.map((item) => {
            const isLogoutItem = item.name === "Salir";
            const isActive = pathname === item.href && !isLogoutItem;

            if (isLogoutItem) {
              return (
                <button
                  key={item.name}
                  onClick={handleLogout}
                  className="flex flex-col items-center justify-center py-2 px-2 text-xs transition-colors text-[var(--primary)] hover:opacity-90"
                  title="Cerrar sesión"
                >
                  <span className="text-base sm:text-lg mb-0.5 sm:mb-1">
                    {typeof item.icon === 'string' ? item.icon : item.icon}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-2 text-xs transition-colors ${
                  isActive ? "text-[var(--primary)]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className="text-base sm:text-lg mb-0.5 sm:mb-1">
                  {typeof item.icon === 'string' ? item.icon : item.icon}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;
