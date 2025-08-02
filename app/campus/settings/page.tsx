"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import CampusLayout from "@/components/layouts/CampusLayout";

export default function AdminSettingsPage() {
  const { data: session } = useSession();

  // Debug: mostrar información de la sesión
  console.log("Session data:", session);
  console.log("User role:", session?.user?.role);

  // Verificar si el usuario es administrador
  const isAdmin = session?.user?.role === "admin";

  // Mostrar información de debug temporalmente
  if (!session) {
    return (
      <CampusLayout>
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-yellow-800 mb-2">
              No hay sesión
            </h1>
            <p className="text-yellow-600">No se detectó una sesión activa.</p>
          </div>
        </div>
      </CampusLayout>
    );
  }

  if (!isAdmin) {
    return (
      <CampusLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-800 mb-2">
              Acceso Denegado
            </h1>
            <p className="text-red-600">
              No tienes permisos para acceder a esta sección.
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded text-left">
              <p className="text-sm">
                <strong>Debug Info:</strong>
              </p>
              <p className="text-sm">Usuario: {session?.user?.name}</p>
              <p className="text-sm">Email: {session?.user?.email}</p>
              <p className="text-sm">
                Rol detectado: {session?.user?.role || "undefined"}
              </p>
              <p className="text-sm">Rol esperado: admin</p>
            </div>
          </div>
        </div>
      </CampusLayout>
    );
  }

  return (
    <CampusLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">
            Gestiona usuarios, materias y configuraciones del campus virtual
          </p>
        </div>

        {/* Admin Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gestión de Usuarios */}
          <Link href="/campus/settings/users" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-blue-500">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors duration-300">
                  <span className="text-2xl group-hover:text-white">👥</span>
                </div>
                <span className="text-blue-500 group-hover:text-blue-600">
                  →
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Gestión de Usuarios
              </h3>
              <p className="text-gray-600">
                Administra estudiantes, profesores y otros usuarios del sistema
              </p>
              <div className="mt-4">
                <span className="text-sm text-blue-600 font-medium">
                  Administrar usuarios →
                </span>
              </div>
            </div>
          </Link>

          {/* Gestión de Materias */}
          <Link href="/campus/settings/subjects" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-green-500">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors duration-300">
                  <span className="text-2xl group-hover:text-white">📚</span>
                </div>
                <span className="text-green-500 group-hover:text-green-600">
                  →
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Gestión de Materias
              </h3>
              <p className="text-gray-600">
                Crea, edita y organiza las materias del campus
              </p>
              <div className="mt-4">
                <span className="text-sm text-green-600 font-medium">
                  Administrar materias →
                </span>
              </div>
            </div>
          </Link>

          {/* Configuración General */}
          <Link href="/campus/settings/general" className="group">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors duration-300">
                  <span className="text-2xl group-hover:text-white">⚙️</span>
                </div>
                <span className="text-purple-500 group-hover:text-purple-600">
                  →
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Configuración General
              </h3>
              <p className="text-gray-600">
                Ajustes generales del sistema y preferencias
              </p>
              <div className="mt-4">
                <span className="text-sm text-purple-600 font-medium">
                  Ver configuración →
                </span>
              </div>
            </div>
          </Link>

          {/* Estadísticas del Sistema */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Estadísticas
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Usuarios:</span>
                <span className="font-semibold">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Materias:</span>
                <span className="font-semibold">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Usuarios Activos:</span>
                <span className="font-semibold">--</span>
              </div>
            </div>
          </div>

          {/* Reportes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Reportes
            </h3>
            <p className="text-gray-600">
              Genera reportes del sistema y actividad de usuarios
            </p>
            <div className="mt-4">
              <button className="text-sm text-red-600 font-medium">
                Generar reporte →
              </button>
            </div>
          </div>

          {/* Respaldos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💾</span>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Respaldos
            </h3>
            <p className="text-gray-600">
              Gestiona respaldos y restauración de datos
            </p>
            <div className="mt-4">
              <button className="text-sm text-indigo-600 font-medium">
                Crear respaldo →
              </button>
            </div>
          </div>
        </div>
      </div>
    </CampusLayout>
  );
}
