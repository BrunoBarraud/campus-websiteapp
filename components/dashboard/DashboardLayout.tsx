"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // No mostrar dashboard en páginas de autenticación
  const isAuthPage = pathname?.includes("/auth/");

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowUserMenu(false);
    if (showUserMenu) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showUserMenu]);

  const navigation = [
    { name: "Dashboard", href: "/campus/dashboard", icon: "🏠" },
    { name: "Mensajes", href: "/campus/messages", icon: "💬" },
    { name: "Notificaciones", href: "/campus/notifications", icon: "🔔" },
    { name: "Calendario", href: "/campus/calendar", icon: "📅" },
    { name: "Perfil", href: "/campus/profile", icon: "👤" },
    { name: "Configuración", href: "/campus/settings", icon: "⚙️" },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Si es una página de auth, renderizar solo el contenido sin layout
  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-rose-950 to-yellow-500 flex items-center justify-center p-2 sm:p-4 lg:p-6 dark:bg-gradient-to-br dark:from-rose-950 dark:to-yellow-500">
        <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-950 to-yellow-500 dark:bg-gradient-to-br dark:from-rose-950 dark:to-yellow-500">
      {/* Sidebar */}
      <div
        className="hidden lg:fixed lg:left-0 lg:z-40 lg:w-64 lg:bg-white/95 lg:backdrop-blur-sm lg:shadow-xl lg:transform lg:transition-all lg:duration-300 lg:ease-in-out lg:block dark:bg-white/95 border-r border-amber-100"
        style={{ top: "12vh", height: "88vh" }}
      >
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 ${
                  pathname === item.href
                    ? "bg-gradient-to-r from-amber-100 to-amber-200 text-rose-900 border-r-4 border-amber-500 shadow-md dark:bg-gradient-to-r dark:from-amber-100 dark:to-amber-200 dark:text-rose-900"
                    : "text-gray-600 hover:bg-gradient-to-r hover:from-amber-50 hover:to-rose-50 hover:text-rose-800 hover:shadow-sm dark:text-gray-600 dark:hover:bg-gradient-to-r dark:hover:from-amber-50 dark:hover:to-rose-50 dark:hover:text-rose-800"
                }`}
              >
                <span className="mr-3 text-lg transition-transform duration-300 hover:scale-110">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* User info */}
        <div className="absolute bottom-4 left-0 right-0 p-4">
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-amber-50 to-rose-50 backdrop-blur-sm rounded-lg shadow-lg border border-amber-200 dark:from-amber-50 dark:to-rose-50 transition-all duration-300 hover:shadow-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-rose-600 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110">
              <span className="text-white font-semibold text-sm">
                {session?.user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-rose-900 truncate dark:text-rose-900">
                {session?.user?.name || "Usuario"}
              </p>
              <p className="text-xs text-rose-600 truncate dark:text-rose-600">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-rose-400 hover:text-rose-600 transition-all duration-300 dark:text-rose-400 dark:hover:text-rose-600 hover:scale-110 hover:rotate-12"
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

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-3 sm:p-6 bg-gradient-to-br from-amber-50/80 to-rose-50/80 backdrop-blur-sm min-h-screen dark:bg-gradient-to-br dark:from-amber-50/80 dark:to-rose-50/80 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-r from-amber-50/95 to-rose-50/95 backdrop-blur-sm border-t border-amber-200/50 z-50 dark:bg-gradient-to-r dark:from-amber-50/95 dark:to-rose-50/95 dark:border-amber-200/50 shadow-lg">
        <div className="grid grid-cols-5 py-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-1 text-xs transition-all duration-300 transform hover:scale-105 ${
                pathname === item.href
                  ? "text-rose-700 dark:text-rose-700"
                  : "text-rose-500 hover:text-rose-800 dark:text-rose-500 dark:hover:text-rose-800"
              }`}
            >
              <span className="text-base sm:text-lg mb-1 transition-transform duration-300 hover:scale-110">{item.icon}</span>
              <span className="truncate text-xs">{item.name}</span>
            </Link>
          ))}
          
          {/* Logout button for mobile */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center py-2 px-1 text-xs transition-all duration-300 text-red-500 hover:text-red-700 dark:text-red-500 dark:hover:text-red-700 transform hover:scale-105"
            title="Cerrar sesión"
          >
            <span className="text-base sm:text-lg mb-1 transition-transform duration-300 hover:scale-110 hover:rotate-12">🚪</span>
            <span className="truncate text-xs">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
