'use client';
import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const SubjectLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigation = [
    { name: "Dashboard", href: "/campus/dashboard", icon: "🏠" },
    { name: "Calendario", href: "/campus/calendar", icon: "📅" },
    { name: "Perfil", href: "/campus/profile", icon: "👤" },
    { name: "Configuración", href: "/campus/settings", icon: "⚙️" },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar (desktop) */}
      <div className="hidden lg:block fixed left-0 top-14 sm:top-16 md:top-20 bottom-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-blue-400 to-blue-500">
          <Link href="/campus/dashboard" className="flex items-center">
            <h1 className="text-xl font-bold text-white hover:text-gray-100 transition-colors">← Volver al Campus</h1>
          </Link>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === item.href
                    ? "bg-blue-100 text-blue-700 border-r-2 border-blue-500"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 w-full p-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
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
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
      <div className="lg:pl-64 pt-14 sm:pt-16 md:pt-20">
        <main className="flex-1 px-4 md:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SubjectLayout;
