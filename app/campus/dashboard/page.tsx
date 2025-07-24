'use client';

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CourseCard from "../../../components/dashboard/CourseCard";
import { User, Subject } from "@/app/lib/types";

const DashboardPage = () => {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user data and subjects
  useEffect(() => {
    const fetchData = async () => {
      if (session?.user?.email) {
        try {
          setLoading(true);
          console.log('Dashboard: Starting to fetch data for:', session.user.email);
          
          // Obtener datos del usuario actual
          const userResponse = await fetch('/api/user/me');
          console.log('Dashboard: User API response status:', userResponse.status);
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('Dashboard: User data received:', userData);
            setUser(userData);
            
            // Obtener materias basadas en el rol del usuario
            let subjectsResponse;
            if (userData.role === 'admin') {
              // Admins ven todas las materias
              console.log('Dashboard: Fetching admin subjects');
              subjectsResponse = await fetch('/api/admin/subjects');
            } else if (userData.role === 'teacher') {
              // Profesores ven sus materias asignadas
              console.log('Dashboard: Fetching teacher subjects');
              subjectsResponse = await fetch(`/api/admin/subjects?teacher_id=${userData.id}`);
            } else if (userData.role === 'student' && userData.year) {
              // Estudiantes ven materias donde están inscritos
              console.log('Dashboard: Fetching student subjects for year:', userData.year);
              subjectsResponse = await fetch('/api/student/subjects');
            } else {
              // Fallback: no hay materias
              console.log('Dashboard: No role match, setting empty subjects');
              setSubjects([]);
              return;
            }
            
            console.log('Dashboard: Subjects API response status:', subjectsResponse?.status);
            
            if (subjectsResponse && subjectsResponse.ok) {
              const subjectsData = await subjectsResponse.json();
              console.log('Dashboard: Subjects data received:', subjectsData);
              setSubjects(subjectsData);
            } else {
              console.log('Dashboard: Subjects API failed, setting empty array');
              if (subjectsResponse) {
                const errorText = await subjectsResponse.text();
                console.log('Dashboard: Subjects API error response:', errorText);
              }
              setSubjects([]);
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setSubjects([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const getWelcomeMessage = () => {
    if (!user) return "Bienvenido al Campus Virtual";
    
    if (user.role === 'admin') {
      return `Bienvenido Administrador ${user.name}`;
    } else if (user.role === 'teacher') {
      return `Bienvenido Profesor ${user.name}`;
    } else if (user.role === 'student') {
      return `Bienvenido ${user.name} - ${user.year}° Año`;
    }
    
    return `Bienvenido ${user.name}`;
  };

  const getSubjectCountMessage = () => {
    if (!user) return "Materias disponibles";
    
    if (user.role === 'student') {
      return `Materias de ${user.year}° Año`;
    } else if (user.role === 'teacher') {
      return "Tus materias asignadas";
    } else {
      return "Todas las materias";
    }
  };

  const getEmptyStateMessage = () => {
    if (!user) return "No hay materias disponibles";
    
    if (user.role === 'student') {
      return `No hay materias disponibles para ${user.year}° año`;
    } else if (user.role === 'teacher') {
      return "No tienes materias asignadas";
    } else {
      return "No hay materias creadas en el sistema";
    }
  };

  const getEmptyStateAction = () => {
    if (user?.role === 'admin') {
      return {
        text: "Crear primera materia",
        href: "/campus/settings/subjects"
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 text-sm sm:text-base">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-yellow-50 via-white to-rose-50 min-h-screen">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-8 sm:mb-12 text-center fade-in">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-600 to-rose-600 bg-clip-text text-transparent">
            {getWelcomeMessage()}
          </h1>
          <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
            {getSubjectCountMessage()} ({subjects.length} materias disponibles)
          </p>
          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button className="px-4 sm:px-6 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-full hover:from-yellow-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base">
              <i className="fas fa-book mr-2"></i> Mis Materias
            </button>
            <button className="px-4 sm:px-6 py-2 border-2 border-yellow-400 text-yellow-600 hover:text-rose-600 hover:border-rose-400 rounded-full hover:bg-gradient-to-r hover:from-yellow-50 hover:to-rose-50 transition-all text-sm sm:text-base">
              <i className="fas fa-calendar mr-2"></i> Horarios
            </button>
          </div>
        </header>

        {/* Search and Filter */}
        <div className="mb-6 sm:mb-8 fade-in delay-1">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="relative w-full lg:w-96">
              <input
                type="text"
                placeholder="Buscar materias..."
                className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white/90 backdrop-blur-sm text-gray-800 text-sm sm:text-base hover:border-rose-300 transition-colors"
              />
              <i className="fas fa-search absolute left-3 top-2.5 sm:top-3 text-yellow-600 text-sm sm:text-base"></i>
            </div>
            {user?.role === 'admin' && (
              <div className="flex space-x-2 w-full lg:w-auto">
                <a
                  href="/campus/settings/subjects"
                  className="flex-1 lg:flex-none px-3 sm:px-4 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-full hover:from-yellow-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-center text-sm sm:text-base"
                >
                  <i className="fas fa-plus mr-2"></i> Gestionar Materias
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-8 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-yellow-200 hover:shadow-xl hover:scale-105 transition-all duration-300 fade-in delay-2">
                <div className="flex items-center">
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-yellow-100 to-rose-100 text-yellow-600 mr-3 sm:mr-4">
                        <i className="fas fa-book text-lg sm:text-xl"></i>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs sm:text-sm font-medium">
                          {user?.role === 'student' ? 'Mis Materias' : 'Total Materias'}
                        </p>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{subjects.length}</h3>
                    </div>
                </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300 fade-in delay-3">
                <div className="flex items-center">
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 text-blue-600 mr-3 sm:mr-4">
                        <i className="fas fa-chalkboard-teacher text-lg sm:text-xl"></i>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs sm:text-sm font-medium">Profesores Activos</p>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                          {[...new Set(subjects.map(s => s.teacher?.name).filter(Boolean))].length}
                        </h3>
                    </div>
                </div>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-xl shadow-lg border border-green-200 hover:shadow-xl hover:scale-105 transition-all duration-300 fade-in delay-4 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center">
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-r from-green-100 to-teal-100 text-green-600 mr-3 sm:mr-4">
                        <i className="fas fa-calendar-check text-lg sm:text-xl"></i>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs sm:text-sm font-medium">
                          {user?.role === 'student' ? `Año ${user.year}` : 'Próximas Clases'}
                        </p>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                          {user?.role === 'student' ? user.year || '-' : '5'}
                        </h3>
                    </div>
                </div>
            </div>
        </div>

        {/* Subjects Grid or Empty State */}
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 mt-8 sm:mt-16 px-4">
            <div className="p-6 bg-gradient-to-r from-yellow-100 to-rose-100 rounded-full mb-6">
              <i className="fas fa-book text-4xl sm:text-6xl text-yellow-600 mb-4"></i>
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2 text-center">
              {getEmptyStateMessage()}
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-4 text-sm sm:text-base">
              {user?.role === 'admin' 
                ? 'Comienza creando materias para el campus virtual'
                : user?.role === 'teacher'
                ? 'Contacta con el administrador para que te asigne materias'
                : 'Las materias se mostrarán aquí cuando estén disponibles'
              }
            </p>
            {getEmptyStateAction() && (
              <a
                href={getEmptyStateAction()!.href}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:from-yellow-600 hover:to-rose-600 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
              >
                <i className="fas fa-plus mr-2"></i>
                {getEmptyStateAction()!.text}
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-16">
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
    </div>
  );
};

export default DashboardPage;
