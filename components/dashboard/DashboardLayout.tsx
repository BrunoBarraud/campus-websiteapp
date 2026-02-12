"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Bell,
  Calendar,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Settings,
  Shield,
  User as UserIcon,
} from "lucide-react";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const open = () => setIsSidebarOpen(true);
    window.addEventListener("campus-open-sidebar", open);
    return () => {
      window.removeEventListener("campus-open-sidebar", open);
    };
  }, []);

  // No mostrar dashboard en páginas de autenticación
  const isAuthPage = pathname?.includes("/auth/");

  const mainNavigation = [
    { name: "Cursos", href: "/campus/dashboard", icon: LayoutDashboard },
    { name: "Calendario", href: "/campus/calendar", icon: Calendar },
  ];

  const accountNavigation = [
    { name: "Perfil", href: "/campus/profile", icon: UserIcon },
    { name: "Notificaciones", href: "/campus/notifications", icon: Bell },
  ];

  const settingsNavigation = [
    ...(session?.user?.role === "admin"
      ? [
          { name: "Configuración", href: "/campus/settings", icon: Settings },
          { name: "Panel Admin", href: "/campus/admin", icon: Shield },
          { name: "Centro de Soporte", href: "/campus/admin/support", icon: MessageSquare },
        ]
      : []),
    ...(session?.user?.role === "admin_director"
      ? [
          { name: "Estudiantes Pendientes", href: "/campus/admin/students", icon: Shield },
        ]
      : []),
  ];

  const supportNavigation = [
    { name: "Soporte", href: "/campus/support", icon: HelpCircle },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  // Sidebar Component
  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="h-full bg-white border-r border-slate-200 flex flex-col">
      <nav className="flex-1 overflow-y-auto p-4 pt-6 space-y-6">
        <div>
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Menú</p>
          <div className="space-y-1">
            {mainNavigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-yellow-50 text-slate-900 border border-yellow-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-yellow-50/60"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-yellow-700" : "text-slate-400"}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cuenta</p>
          <div className="space-y-1">
            {accountNavigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-yellow-50 text-slate-900 border border-yellow-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-yellow-50/60"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-yellow-700" : "text-slate-400"}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {settingsNavigation.length > 0 && (
          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ajustes</p>
            <div className="space-y-1">
              {settingsNavigation.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      active
                        ? "bg-yellow-50 text-slate-900 border border-yellow-100"
                        : "text-slate-600 hover:text-slate-900 hover:bg-yellow-50/60"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-yellow-700" : "text-slate-400"}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Soporte</p>
          <div className="space-y-1">
            {supportNavigation.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onNavigate}
                  className={`sidebar-link flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-yellow-50 text-slate-900 border border-yellow-100"
                      : "text-slate-600 hover:text-slate-900 hover:bg-yellow-50/60"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-yellow-700" : "text-slate-400"}`} />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:text-red-700 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-5 w-5 text-slate-400" />
          <span>Salir</span>
        </button>
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
    <div className="flex flex-col min-h-screen bg-slate-50">
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
        <aside className="hidden lg:block w-72 sticky top-0 h-[calc(100vh-0px)]">
          <Sidebar />
        </aside>

        {/* Main content area */}
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 pb-28 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-border z-50 shadow-soft shadow-[0_-4px_16px_rgba(0,0,0,0.16)] pb-safe">
        <div className="flex items-center justify-around py-1 sm:py-2">
          {[...mainNavigation, ...accountNavigation].map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-2 text-xs transition-colors ${
                  isActive ? "text-yellow-700" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="h-5 w-5 mb-1" />
              </Link>
            );
          })}

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={`flex flex-col items-center justify-center py-2 px-2 text-xs transition-colors ${
              showMobileMenu ? "text-yellow-700" : "text-slate-500 hover:text-slate-700"
            }`}
            title="Más opciones"
          >
            <MoreHorizontal className="h-5 w-5 mb-1" />
          </button>

          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center py-2 px-2 text-xs transition-colors text-slate-500 hover:text-red-700"
            title="Cerrar sesión"
          >
            <LogOut className="h-5 w-5 mb-1" />
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black/50 z-40 flex items-end" onClick={() => setShowMobileMenu(false)}>
            <div className="bg-white w-full rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
              <div className="space-y-2">
                {settingsNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive ? "bg-yellow-50 text-yellow-700 border border-yellow-100" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                {supportNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive ? "bg-yellow-50 text-yellow-700 border border-yellow-100" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default DashboardLayout;
