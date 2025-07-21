'use client';
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
          
          // Obtener datos del usuario actual
          const userResponse = await fetch('/api/user/me');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);
            
            // Obtener materias basadas en el rol del usuario
            let subjectsResponse;
            if (userData.role === 'admin') {
              // Admins ven todas las materias
              subjectsResponse = await fetch('/api/admin/subjects');
            } else if (userData.role === 'teacher') {
              // Profesores ven sus materias asignadas
              subjectsResponse = await fetch(`/api/admin/subjects?teacher_id=${userData.id}`);
            } else if (userData.role === 'student' && userData.year) {
              // Estudiantes ven materias de su año
              subjectsResponse = await fetch(`/api/admin/subjects?year=${userData.year}`);
            } else {
              // Fallback: no hay materias
              setSubjects([]);
              return;
            }
            
            if (subjectsResponse && subjectsResponse.ok) {
              const subjectsData = await subjectsResponse.json();
              setSubjects(subjectsData);
            } else {
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
      <div className="bg-gray-50 min-h-screen container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-12 text-center fade-in">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {getWelcomeMessage()}
          </h1>
          <p className="text-gray-600 mb-6">
            {getSubjectCountMessage()} ({subjects.length} materias disponibles)
          </p>
          <div className="mt-6 flex justify-center space-x-4">
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-all shadow-md">
              <i className="fas fa-book mr-2"></i> Mis Materias
            </button>
            <button className="px-6 py-2 border border-indigo-600 text-indigo-600 rounded-full hover:bg-indigo-50 transition-all">
              <i className="fas fa-calendar mr-2"></i> Horarios
            </button>
          </div>
        </header>

        {/* Search and Filter */}
        <div className="mb-8 fade-in delay-1">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <input
                type="text"
                placeholder="Buscar materias..."
                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800"
              />
              <i className="fas fa-search absolute left-3 top-3 text-gray-600"></i>
            </div>
            {user?.role === 'admin' && (
              <div className="flex space-x-2">
                <a
                  href="/campus/settings/subjects"
                  className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-md"
                >
                  <i className="fas fa-plus mr-2"></i> Gestionar Materias
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md fade-in delay-2">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
                        <i className="fas fa-book text-xl"></i>
                    </div>
                    <div>
                        <p className="text-gray-500">
                          {user?.role === 'student' ? 'Mis Materias' : 'Total Materias'}
                        </p>
                        <h3 className="text-2xl font-bold">{subjects.length}</h3>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md fade-in delay-3">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <i className="fas fa-chalkboard-teacher text-xl"></i>
                    </div>
                    <div>
                        <p className="text-gray-500">Profesores Activos</p>
                        <h3 className="text-2xl font-bold">
                          {[...new Set(subjects.map(s => s.teacher?.name).filter(Boolean))].length}
                        </h3>
                    </div>
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md fade-in delay-4">
                <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <i className="fas fa-calendar-check text-xl"></i>
                    </div>
                    <div>
                        <p className="text-gray-500">
                          {user?.role === 'student' ? `Año ${user.year}` : 'Próximas Clases'}
                        </p>
                        <h3 className="text-2xl font-bold">
                          {user?.role === 'student' ? user.year || '-' : '5'}
                        </h3>
                    </div>
                </div>
            </div>
        </div>

        {/* Subjects Grid or Empty State */}
        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 mt-16">
            <i className="fas fa-book text-6xl text-gray-400 mb-4"></i>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {getEmptyStateMessage()}
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-4">
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
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                {getEmptyStateAction()!.text}
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-16">
            {subjects.map((subject, index) => (
              <CourseCard 
                key={subject.id} 
                course={{
                  id: subject.id,
                  title: subject.name,
                  teacher: subject.teacher?.name || 'Sin profesor',
                  image: subject.image_url || 'https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Sin+Imagen',
                  code: subject.code,
                  year: subject.year
                }} 
                delay={index + 1} 
              />
            ))}
          </div>
        )}
      </div>
  );
};

export default DashboardPage;
