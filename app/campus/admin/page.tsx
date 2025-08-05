"use client";

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AdminDashboardProps {}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSubjects: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalAdmins: 0,
    activeUsers: 0,
  });

  // Verificar autenticación y permisos
  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/campus/login");
      return;
    }

    if (session.user?.role !== "admin") {
      router.push("/campus/dashboard");
      return;
    }

    setLoading(false);
  }, [session, status, router]);

  // Cargar estadísticas
  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await fetch("/api/users/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    if (!loading) {
      loadStats();
    }
  }, [loading]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 mt-[12vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Cargando panel de administración...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 mt-[12vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Panel de Administración
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona usuarios, materias y configuraciones del campus
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div
            onClick={() => router.push("/campus/settings/users")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Gestión de Usuarios
                </h3>
                <p className="text-sm text-gray-600">
                  Administrar perfiles, roles y permisos
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push("/campus/settings/subjects")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">📚</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Gestión de Materias
                </h3>
                <p className="text-sm text-gray-600">
                  Administrar materias y profesores
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => router.push("/campus/settings")}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200 hover:border-blue-300"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">⚙️</span>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Configuraciones
                </h3>
                <p className="text-sm text-gray-600">
                  Ajustes generales del sistema
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            📊 Estadísticas del Sistema
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-blue-900">
                    Total Usuarios
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalUsers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm">🎓</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-900">
                    Estudiantes
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalStudents}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-sm">👨‍🏫</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-purple-900">
                    Profesores
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.totalTeachers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 text-sm">📚</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-orange-900">
                    Materias
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.totalSubjects}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-red-600 text-sm">👑</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-900">
                    Administradores
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.totalAdmins}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-teal-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <span className="text-teal-600 text-sm">✅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-teal-900">
                    Usuarios Activos
                  </p>
                  <p className="text-2xl font-bold text-teal-600">
                    {stats.activeUsers}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
