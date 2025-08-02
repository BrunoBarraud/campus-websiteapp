"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Footer from "@/components/Home/Footer/Footer";
import { ACADEMIC_CONFIG } from "@/constant/academic";

const CampusLayout = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigation = [
    { name: "Cursos", href: "/campus/dashboard", icon: "🏠" },
    { name: "Mensajes", href: "/campus/messages", icon: "💬" },
    { name: "Notificaciones", href: "/campus/notifications", icon: "🔔" },
    { name: "Calendario", href: "/campus/calendar", icon: "📅" },
    { name: "Perfil", href: "/campus/profile", icon: "👤" },
    { name: "Configuración", href: "/campus/settings", icon: "⚙️" },
  ];

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR - Fijo arriba */}
      <nav className="sticky top-0 bg-rose-950 border-b border-rose-800 h-20 z-50 shadow-lg">
        <div className="flex items-center h-full justify-between max-w-full mx-auto px-6">
          {/* Logo y Título */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              {/* Logo con animación independiente */}
              <div className="w-12 h-12 flex justify-center items-center relative hover:scale-110 transition-transform duration-300 ease-in-out">
                <Image
                  src={ACADEMIC_CONFIG.INSTITUTION.logo}
                  alt={`Logo Campus Virtual ${ACADEMIC_CONFIG.INSTITUTION.name}`}
                  width={48}
                  height={48}
                  className="w-12 h-12 object-contain transition-all duration-300 hover:rotate-12 relative z-10"
                />
              </div>
              {/* Texto con animación independiente */}
              <div className="flex items-center space-x-1">
                <span className="px-3 py-1 bg-amber-400 text-rose-950 text-xl font-bold rounded-md shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  Campus
                </span>
                <span className="px-3 py-1 bg-rose-950 text-amber-400 text-xl font-bold rounded-md shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  Virtual
                </span>
              </div>
            </div>
          </div>

          {/* Información del Usuario */}
          {session?.user && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-amber-400">
                    {session.user.name}
                  </p>
                  <p className="text-xs text-amber-300">
                    {session.user.role === "admin"
                      ? "Administrador"
                      : session.user.role === "teacher"
                      ? "Profesor"
                      : "Estudiante"}
                  </p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                  <span className="text-rose-950 text-sm font-bold">
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
              </div>
              <div className="h-6 w-px bg-rose-800"></div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-amber-400 hover:text-red-400 hover:bg-rose-900 rounded-lg transition-all duration-200 group"
                title="Cerrar sesión"
              >
                <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                  🚪
                </span>
                <span className="text-sm font-medium">Salir</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL - Flexbox para sidebar y contenido */}
      <div className="flex flex-1">
        {/* SIDEBAR - Funcionalidades */}
        <aside className="w-64 bg-rose-950 border-r border-rose-800 flex-shrink-0">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  pathname === item.href
                    ? "bg-amber-400 text-rose-950 shadow-md"
                    : "text-amber-300 hover:bg-rose-900 hover:text-amber-400"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* CONTENIDO DE LA PÁGINA */}
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>

      {/* FOOTER - Fijo abajo */}
      <Footer />
    </div>
  );
};

export default CampusLayout;
