"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import SecurityNotificationsProvider from "../layout/SecurityNotificationsProvider";
import NotificationBadge from "../notifications/NotificationBadge";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // No mostrar dashboard en páginas de autenticación
  const isAuthPage = pathname?.includes("/auth/");

  const navigation = [
    { name: "Cursos", href: "/campus/dashboard", icon: "🏠" },
    { name: "Calendario", href: "/campus/calendar", icon: "📅" },
  { name: "Mensajería", href: "/campus/mensajeria", icon: <i className="fas fa-comments"></i> },
    { name: "Perfil", href: "/campus/profile", icon: "👤" },
    { name: "Notificaciones", href: "/campus/notifications", icon: "🔔" },
    ...(session?.user?.role === "admin"
      ? [{ name: "Configuración", href: "/campus/settings", icon: "⚙️" }]
      : []),
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Sidebar Component
  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="h-full bg-white border-r border-border shadow-soft flex flex-col">
      <nav className="mt-8 flex-1">
        <div className="px-3 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                pathname === item.href
                  ? "bg-white text-rose-950 border border-rose-950"
                  : "text-rose-950 hover:bg-muted hover:text-gray-900"
              }`}
            >
              <span className="mr-3 text-lg">{typeof item.icon === 'string' ? item.icon : item.icon}</span>
              {item.name}
            </Link>
          ))}
        </div>
      </nav>

      {/* User info */}
      <div className="p-4 mt-auto">
        <div className="flex items-center space-x-3 p-3 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200">
          <div className="w-8 h-8 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)] rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-sm">
              {session?.user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name || "Usuario"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Cerrar sesión"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
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
        <aside className="hidden lg:block w-64">
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

      {/* Footer */}
      <footer
        className="py-2 sm:py-3 text-center"
        style={{
          background: 'linear-gradient(90deg, var(--primary), var(--primary))',
          color: '#ffffff'
        }}
      >
        <div className="px-4">
          <p className="text-xs sm:text-sm">
            Copyright © {new Date().getFullYear()} Campus Virtual IPDVS. Todos
            los derechos reservados.
          </p>
          <p className="text-xs mt-1 opacity-90">
            Bruno Ariel Barraud, Fullstack Developer
          </p>
        </div>
      </footer>

      {/* Bottom navigation for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border z-50 shadow-soft pb-safe">
        <div className="flex items-center justify-around py-1 sm:py-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-2 text-xs transition-colors ${
                pathname === item.href
                  ? "text-[var(--primary)]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="text-base sm:text-lg mb-0.5 sm:mb-1">
                {typeof item.icon === 'string' ? item.icon : item.icon}
              </span>
              <span className="truncate text-xs">{item.name}</span>
            </Link>
          ))}
          {/* Logout button for mobile */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center py-2 px-2 text-xs transition-colors text-[var(--primary)] hover:opacity-90"
            title="Cerrar sesión"
          >
            <span className="text-base sm:text-lg mb-0.5 sm:mb-1">
              🚪
            </span>
            <span className="truncate text-xs">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default DashboardLayout;
