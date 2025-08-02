"use client";
import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Footer from "@/components/Home/Footer/Footer";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const pathname = usePathname();

  // No mostrar dashboard en páginas de autenticación
  const isAuthPage = pathname?.includes("/auth/");

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
      <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:w-64 lg:bg-white lg:shadow-sm lg:h-full lg:block border-r border-gray-200">
        <div className="pt-20 pb-4 h-full flex flex-col">
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  pathname === item.href
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="mr-3 text-base">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User info */}
          {session?.user && (
            <div className="px-4 pb-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {session.user.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session.user.name || "Usuario"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session.user.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  title="Cerrar sesión"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:ml-64 pb-0 lg:pb-0">
        {children}
      </div>

      {/* Bottom navigation para móviles */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 text-xs transition-colors duration-200 ${
                pathname === item.href
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
          
          {/* Logout button para móviles */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center py-2 text-xs text-red-500 hover:text-red-700 transition-colors duration-200"
            title="Cerrar sesión"
          >
            <span className="text-lg mb-1">🚪</span>
            <span className="truncate">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
