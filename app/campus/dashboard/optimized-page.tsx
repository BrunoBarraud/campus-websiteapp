'use client';

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React, { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useOptimizedData } from "@/hooks/useOptimizedData";
import { CourseGridSkeleton, StatsCardSkeleton } from "@/components/lazy/LazyComponents";
import CourseCard from "../../../components/dashboard/CourseCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { User, Subject } from "@/app/lib/types";

// Componente de estadísticas optimizado
const DashboardStats = React.memo(({ user, subjects }: { user: User; subjects: Subject[] }) => {
  const getTotalSubjects = () => subjects.length;
  
  const getActiveTeachers = () => {
    if (user.role !== 'admin') return 0;
    return [...new Set(subjects.map(s => s.teacher?.name).filter(Boolean))].length;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {/* Estadística de materias */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border-2 border-yellow-100 hover:border-rose-200 transition-all duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">
              {user?.role === 'student' ? 'Mis Materias' : user?.role === 'teacher' ? 'Mis Materias' : 'Total Materias'}
            </h3>
            <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-rose-600 bg-clip-text text-transparent">
              {getTotalSubjects()}
            </p>
          </div>
          <div className="h-12 w-12 bg-gradient-to-r from-yellow-100 to-rose-100 rounded-full flex items-center justify-center">
            <i className="fas fa-book text-yellow-600 text-lg sm:text-xl"></i>
          </div>
        </div>
      </div>

      {/* Solo mostrar estadísticas de profesores para admins */}
      {user?.role === 'admin' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border-2 border-yellow-100 hover:border-rose-200 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Profesores</h3>
              <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-rose-600 bg-clip-text text-transparent">
                {getActiveTeachers()}
              </p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-r from-yellow-100 to-rose-100 rounded-full flex items-center justify-center">
              <i className="fas fa-chalkboard-teacher text-lg sm:text-xl"></i>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
DashboardStats.displayName = 'DashboardStats';

// Componente principal optimizado
const OptimizedDashboardPage = () => {
  const { data: session } = useSession();
  
  // Hook para datos de usuario con cache
  const { 
    data: userData, 
    loading: userLoading, 
    error: userError 
  } = useOptimizedData<User>({
    apiUrl: '/api/user/me',
    cacheKey: 'current-user',
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: true
  });

  const user = userData?.[0] || null;

  // Hook para datos de materias con cache
  const getSubjectsUrl = () => {
    if (!user) return '';
    
    if (user.role === 'admin') {
      return '/api/admin/subjects';
    } else if (user.role === 'teacher') {
      return `/api/admin/subjects?teacher_id=${user.id}`;
    } else if (user.role === 'student') {
      return '/api/student/subjects';
    }
    return '';
  };

  const { 
    data: subjects, 
    loading: subjectsLoading, 
    error: subjectsError,
    refresh: refreshSubjects
  } = useOptimizedData<Subject>({
    apiUrl: getSubjectsUrl(),
    cacheKey: `subjects-${user?.role}-${user?.id}`,
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: false
  });

  // Loading states
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Verificando sesión..." />
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Cargando perfil..." />
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {userError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Configurando dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header optimizado */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border-2 border-yellow-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-rose-600 bg-clip-text text-transparent">
              ¡Bienvenido, {user.name}!
            </h1>
            <p className="text-gray-600 mt-1">
              {user.role === 'student' && 'Aquí tienes acceso a todas tus materias y recursos de estudio.'}
              {user.role === 'teacher' && 'Panel de gestión para tus materias y estudiantes.'}
              {user.role === 'admin' && 'Panel de administración del sistema educativo.'}
            </p>
          </div>
          
          <button
            onClick={refreshSubjects}
            disabled={subjectsLoading}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {subjectsLoading ? (
              <i className="fas fa-spinner fa-spin mr-2"></i>
            ) : (
              <i className="fas fa-sync-alt mr-2"></i>
            )}
            Actualizar
          </button>
        </div>
      </div>

      {/* Estadísticas con Suspense */}
      <Suspense fallback={<StatsCardSkeleton />}>
        {user && subjects && <DashboardStats user={user} subjects={subjects} />}
      </Suspense>

      {/* Título de sección */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          {user?.role === 'student' ? 'Mis Materias' : user?.role === 'teacher' ? 'Mis Materias' : 'Materias del Sistema'}
        </h2>
        {subjects.length > 0 && (
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {subjects.length} {subjects.length === 1 ? 'materia' : 'materias'}
          </span>
        )}
      </div>

      {/* Grid de materias con loading optimizado */}
      {subjectsLoading ? (
        <CourseGridSkeleton count={8} />
      ) : subjectsError ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error: {subjectsError}</p>
          <button 
            onClick={refreshSubjects}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg"
          >
            Reintentar
          </button>
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border-2 border-yellow-100">
            <i className="fas fa-book-open text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No hay materias disponibles</h3>
            <p className="text-gray-500">
              {user.role === 'student' && 'Aún no tienes materias asignadas.'}
              {user.role === 'teacher' && 'No tienes materias asignadas para enseñar.'}
              {user.role === 'admin' && 'No se han creado materias en el sistema.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {subjects.map((subject, index) => (
            <CourseCard 
              key={subject.id} 
              course={{
                id: subject.id,
                title: subject.name,
                teacher: subject.teacher?.name || 'Sin profesor',
                image: subject.image_url || 'https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Sin+Imagen',
                code: subject.code,
                year: subject.year,
                division: subject.division
              }} 
              delay={index + 1} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OptimizedDashboardPage;
