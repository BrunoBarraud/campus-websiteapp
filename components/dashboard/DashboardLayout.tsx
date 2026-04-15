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
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

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

  useEffect(() => {
    setIsSidebarOpen(false);
    setShowMobileMenu(false);
  }, [pathname]);

  const isAuthPage = pathname?.includes("/auth/");

  const mainNavigation: NavItem[] = [
    { name: "Cursos", href: "/campus/dashboard", icon: LayoutDashboard },
    { name: "Calendario", href: "/campus/calendar", icon: Calendar },
  ];

  const accountNavigation: NavItem[] = [
    { name: "Perfil", href: "/campus/profile", icon: UserIcon },
    { name: "Notificaciones", href: "/campus/notifications", icon: Bell },
  ];

  const settingsNavigation: NavItem[] = [
    ...(session?.user?.role === "admin"
      ? [
          { name: "Configuración", href: "/campus/settings", icon: Settings },
          { name: "Panel Admin", href: "/campus/admin", icon: Shield },
          { name: "Centro de Soporte", href: "/campus/admin/support", icon: MessageSquare },
        ]
      : []),
    ...(session?.user?.role === "admin_director"
      ? [{ name: "Estudiantes Pendientes", href: "/campus/admin/students", icon: Shield }]
      : []),
  ];

  const supportNavigation: NavItem[] = [{ name: "Soporte", href: "/campus/support", icon: HelpCircle }];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const NavSection = ({
    title,
    items,
    onNavigate,
  }: {
    title: string;
    items: NavItem[];
    onNavigate?: () => void;
  }) => (
    <section className="space-y-2.5">
      <p className="px-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "border-yellow-200 bg-yellow-50 text-slate-900 shadow-[0_10px_24px_-18px_rgba(245,158,11,0.85)]"
                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors",
                  active
                    ? "border-yellow-200 bg-white text-yellow-700"
                    : "border-slate-200 bg-slate-50 text-slate-400 group-hover:border-slate-300 group-hover:bg-white group-hover:text-slate-600"
                )}
              >
                <Icon className="h-[17px] w-[17px]" />
              </span>
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );

  const Sidebar = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="h-full overflow-hidden bg-white">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-200 px-5 py-4">
          <h1 className="mt-1.5 text-base font-semibold text-slate-900">Panel principal</h1>
          <p className="mt-1 text-sm text-slate-500">Accesos, navegación y herramientas del campus.</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-5">
            <NavSection title="Menú" items={mainNavigation} onNavigate={onNavigate} />
            <NavSection title="Cuenta" items={accountNavigation} onNavigate={onNavigate} />
            {settingsNavigation.length > 0 && (
              <NavSection title="Ajustes" items={settingsNavigation} onNavigate={onNavigate} />
            )}
            <NavSection title="Soporte" items={supportNavigation} onNavigate={onNavigate} />
          </div>
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-900">{session?.user?.name || "Usuario"}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="h-5 w-5 text-slate-400" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="dashboard-shell min-h-screen bg-slate-50">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="relative h-full w-[88vw] max-w-80 shrink-0 bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm"
              aria-label="Cerrar navegación"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar onNavigate={() => setIsSidebarOpen(false)} />
          </div>
          <div className="flex-grow bg-slate-950/45 backdrop-blur-[1px]" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}

      <div className="flex min-h-screen w-full items-stretch">
        <aside className="hidden lg:block lg:w-[292px] lg:shrink-0 lg:self-start xl:w-[304px]">
          <div className="dashboard-sidebar sticky top-0 h-[100dvh] overflow-hidden border-r border-slate-200 bg-white">
            <Sidebar />
          </div>
        </aside>

        <main className="dashboard-main min-w-0 flex-1">
          <div className="min-h-[100dvh] w-full px-3 pb-24 pt-3 sm:px-4 sm:pt-4 md:px-5 md:pt-5 lg:px-6 lg:pb-6 xl:px-7">
            {children}
          </div>
        </main>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl pb-safe lg:hidden">
        <div className="flex items-center justify-around px-2 py-1.5 sm:py-2">
          {[...mainNavigation, ...accountNavigation].map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex min-w-0 flex-col items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-medium transition-colors",
                  isActive ? "bg-yellow-50 text-yellow-700" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="mb-1 h-5 w-5" />
              </Link>
            );
          })}

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-medium transition-colors",
              showMobileMenu ? "bg-yellow-50 text-yellow-700" : "text-slate-500 hover:text-slate-700"
            )}
            title="Más opciones"
          >
            <MoreHorizontal className="mb-1 h-5 w-5" />
          </button>

          <button
            onClick={handleLogout}
            className="flex flex-col items-center justify-center rounded-2xl px-3 py-2 text-[11px] font-medium text-slate-500 transition-colors hover:text-red-700"
            title="Cerrar sesión"
          >
            <LogOut className="mb-1 h-5 w-5" />
          </button>
        </div>

        {showMobileMenu && (
          <div className="fixed inset-0 z-40 flex items-end bg-slate-950/45" onClick={() => setShowMobileMenu(false)}>
            <div
              className="w-full rounded-t-[28px] border-t border-slate-200 bg-white p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200"></div>
              <div className="space-y-2">
                {settingsNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                        isActive
                          ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                          : "border-transparent text-slate-600 hover:bg-slate-50"
                      )}
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
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                        isActive
                          ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                          : "border-transparent text-slate-600 hover:bg-slate-50"
                      )}
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
