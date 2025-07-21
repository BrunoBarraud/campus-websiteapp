'use client';
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // No mostrar dashboard en páginas de autenticación
  const isAuthPage = pathname?.includes('/auth/');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowUserMenu(false);
    if (showUserMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUserMenu]);

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
      <div className="hidden lg:fixed lg:left-0 lg:z-40 lg:w-64 lg:bg-white/90 lg:backdrop-blur-sm lg:shadow-lg lg:transform lg:transition-transform lg:duration-300 lg:ease-in-out lg:block dark:bg-white/90" 
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
          <div className="flex items-center space-x-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm dark:bg-white/80">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-sm">
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
        <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-gray-200/50 dark:bg-white/90 dark:border-gray-200/50 relative">
          <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-800 truncate">
              {pathname === "/campus/dashboard" && "Mis Cursos"}
              {pathname === "/campus/calendar" && "Calendario Académico"}
              {pathname === "/campus/profile" && "Mi Perfil"}
              {pathname === "/campus/settings" && "Configuración"}
              {pathname.startsWith("/campus/subjects/") && "Detalle de Materia"}
            </h1>
            
            {/* User menu for mobile */}
            <div className="lg:hidden relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUserMenu(!showUserMenu);
                }}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white font-semibold text-sm">
                    {session?.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown menu */}
              {showUserMenu && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-1 w-64 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200/50 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-200/50">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session?.user?.name || "Usuario"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-6 bg-white/80 backdrop-blur-sm min-h-screen dark:bg-white/80 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200/50 z-50 dark:bg-white/90 dark:border-gray-200/50 shadow-lg">
        <div className="grid grid-cols-5 py-1">
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
              <span className="text-base sm:text-lg mb-1">{item.icon}</span>
              <span className="truncate text-xs">{item.name}</span>
            </Link>
          ))}
          {/* Logout button for mobile */}
          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors text-red-500 hover:text-red-700 dark:text-red-500 dark:hover:text-red-700"
            title="Cerrar sesión"
          >
            <span className="text-base sm:text-lg mb-1">🚪</span>
            <span className="truncate text-xs">Salir</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
