'use client';
import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const pathname = usePathname();

  // No mostrar dashboard en páginas de autenticación
  const isAuthPage = pathname?.includes('/auth/');

  const navigation = [
    { name: "Dashboard", href: "/campus/dashboard", icon: "🏠" },
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
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 dark:bg-gray-50">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-50">
      {/* Sidebar */}
      <div className="hidden lg:fixed lg:left-0 lg:z-40 lg:w-64 lg:bg-white lg:shadow-lg lg:transform lg:transition-transform lg:duration-300 lg:ease-in-out lg:block dark:bg-white" 
           style={{ top: '12vh', height: '88vh' }}>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href
                    ? "bg-yellow-100 text-yellow-700 border-r-2 border-yellow-500 dark:bg-yellow-100 dark:text-yellow-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-600 dark:hover:bg-gray-100 dark:hover:text-gray-900"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* User info */}
        <div className="absolute bottom-4 left-0 right-0 p-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-50">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {session?.user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate dark:text-gray-900">
                {session?.user?.name || "Usuario"}
              </p>
              <p className="text-xs text-gray-500 truncate dark:text-gray-500">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors dark:text-gray-400 dark:hover:text-gray-600"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="bg-white shadow-sm border-b border-gray-200 dark:bg-white dark:border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-800">
              {pathname === "/campus/dashboard" && "Mis Cursos"}
              {pathname === "/campus/calendar" && "Calendario Académico"}
              {pathname === "/campus/profile" && "Mi Perfil"}
              {pathname === "/campus/settings" && "Configuración"}
              {pathname.startsWith("/campus/subjects/") && "Detalle de Materia"}
            </h1>
          </div>
        </header>

        <main className="p-6 bg-white min-h-screen dark:bg-white">
          {children}
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 dark:bg-white dark:border-gray-200">
        <div className="grid grid-cols-4 py-2">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors ${
                pathname === item.href
                  ? "text-yellow-600 dark:text-yellow-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-700"
              }`}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
