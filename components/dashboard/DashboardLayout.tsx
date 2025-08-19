"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import SecurityNotificationsProvider from "../layout/SecurityNotificationsProvider";
import NotificationBadge from "../notifications/NotificationBadge";
import { ThemeToggleCompact } from "../ui/ThemeToggle";

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
    <div className="h-full bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 shadow-lg flex flex-col">
      <nav className="mt-8 flex-1">
        <div className="px-4 space-y-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                pathname === item.href
                  ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-r-2 border-yellow-500"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
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
        <div className="flex items-center space-x-3 p-3 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-sm">
              {session?.user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {session?.user?.name || "Usuario"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {session?.user?.email}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <ThemeToggleCompact />
            <button
              onClick={handleLogout}
              className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-rose-950 to-yellow-500">
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
        <main className="flex-1 bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          {/* Proveedor de notificaciones de seguridad */}
          <SecurityNotificationsProvider />
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-rose-950 to-rose-800 dark:from-gray-900 dark:to-gray-800 text-amber-100 dark:text-gray-300 py-2 sm:py-3 text-center">
        <div className="px-4">
          <p className="text-xs sm:text-sm">
            Copyright © {new Date().getFullYear()} Campus Virtual IPDVS. Todos
            los derechos reservados.
          </p>
          <p className="text-xs mt-1 text-amber-200">
            Bruno Ariel Barraud, Fullstack Developer
          </p>
        </div>
      </footer>

      {/* Bottom navigation for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 z-50 shadow-lg pb-safe">
        <div className="grid grid-cols-6 py-1 sm:py-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 sm:py-2 px-1 text-xs transition-colors ${
                pathname === item.href
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <span className="text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1">
                {typeof item.icon === 'string' ? item.icon : item.icon}
              </span>
              <span className="truncate text-xs">{item.name}</span>
            </Link>
          ))}
          {/* Logout button for mobile */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center py-1 sm:py-2 px-1 text-xs transition-colors text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            title="Cerrar sesión"
          >
            <span className="text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1">
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
