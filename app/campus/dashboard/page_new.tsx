'use client';
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { User, Subject } from "@/app/lib/types";
import { FiPlus, FiEdit, FiTrash2, FiSettings, FiBook, FiUsers, FiBarChart, FiCalendar } from 'react-icons/fi';

const DashboardPage = () => {
  const { data: session } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

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
              // Estudiantes ven materias donde están inscritos
              subjectsResponse = await fetch('/api/student/subjects');
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

  // Filtrar materias
  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === 'all' || subject.year === selectedYear;
    return matchesSearch && matchesYear;
  });

  const getWelcomeMessage = () => {
    if (!user) return "Bienvenido al Campus Virtual";
    
    if (user.role === 'admin') {
      return `Panel de Administración - ${user.name}`;
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
      return "Gestión de Materias del Campus";
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

  const handleCreateSubject = () => {
    window.location.href = '/campus/settings/subjects';
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta materia?')) return;
    
    try {
      const response = await fetch(`/api/subjects/${subjectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSubjects(subjects.filter(s => s.id !== subjectId));
        alert('Materia eliminada correctamente');
      } else {
        const error = await response.json();
        alert(`Error al eliminar la materia: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Error al eliminar la materia');
    }
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
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {getWelcomeMessage()}
              </h1>
              <p className="text-gray-600">
                {getSubjectCountMessage()} ({filteredSubjects.length} de {subjects.length} materias)
              </p>
            </div>
            
            {user?.role === 'admin' && (
              <div className="flex space-x-3 mt-4 md:mt-0">
                <button
                  onClick={handleCreateSubject}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Nueva Materia</span>
                </button>
                <a
                  href="/campus/settings/subjects"
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                >
                  <FiSettings className="w-4 h-4" />
                  <span>Gestión Avanzada</span>
                </a>
              </div>
            )}
          </div>
        </header>

        {/* Stats Cards - Solo para administradores */}
        {user?.role === 'admin' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                  <FiBook className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Materias</p>
                  <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                  <FiUsers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Con Profesor</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subjects.filter(s => s.teacher_id).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                  <FiCalendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Años Activos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {[...new Set(subjects.map(s => s.year))].length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
                  <FiBarChart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sin Asignar</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subjects.filter(s => !s.teacher_id).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar materias por nombre, código o profesor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              >
                <option value="all">Todos los años</option>
                <option value={1}>1° Año</option>
                <option value={2}>2° Año</option>
                <option value={3}>3° Año</option>
                <option value={4}>4° Año</option>
                <option value={5}>5° Año</option>
                <option value={6}>6° Año</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subjects Grid or Empty State */}
        {filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <FiBook className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {subjects.length === 0 ? getEmptyStateMessage() : 'No se encontraron materias'}
            </h3>
            <p className="text-gray-500 text-center max-w-md mb-4">
              {subjects.length === 0 
                ? (user?.role === 'admin' 
                  ? 'Comienza creando materias para el campus virtual'
                  : user?.role === 'teacher'
                  ? 'Contacta con el administrador para que te asigne materias'
                  : 'Las materias se mostrarán aquí cuando estén disponibles'
                )
                : 'Intenta ajustar los filtros de búsqueda'
              }
            </p>
            {subjects.length === 0 && getEmptyStateAction() && (
              <a
                href={getEmptyStateAction()!.href}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <FiPlus className="w-4 h-4" />
                <span>{getEmptyStateAction()!.text}</span>
              </a>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredSubjects.map((subject, index) => (
              <AdminSubjectCard 
                key={subject.id} 
                subject={subject}
                canEdit={user?.role === 'admin'}
                onDelete={handleDeleteSubject}
                delay={index + 1} 
              />
            ))}
          </div>
        )}
      </div>
  );
};

// Nuevo componente para las tarjetas de materias con funcionalidad de administrador
const AdminSubjectCard = ({ subject, canEdit, onDelete, delay }: {
  subject: Subject;
  canEdit: boolean;
  onDelete: (id: string) => void;
  delay: number;
}) => {
  const [imageError, setImageError] = useState(false);
  const fallbackImage = "/images/ipdvs-logo.png";

  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg fade-in delay-${delay} group`}>
      {/* Image with overlay for admin actions */}
      <div className="relative overflow-hidden aspect-video">
        <img 
          src={imageError ? fallbackImage : subject.image_url || fallbackImage} 
          alt={subject.name} 
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageError(true)}
        />
        
        {/* Admin overlay */}
        {canEdit && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <a
                href={`/campus/subjects/${subject.id}`}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                title="Gestionar contenido y unidades"
              >
                <FiBook className="w-4 h-4" />
              </a>
              <a
                href={`/campus/settings/subjects`}
                className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
                title="Editar materia"
              >
                <FiEdit className="w-4 h-4" />
              </a>
              <button
                onClick={() => onDelete(subject.id)}
                className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                title="Eliminar materia"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors">
            {subject.name}
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {subject.code} - {subject.year}°
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {subject.description || 'Sin descripción disponible'}
        </p>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2">
              <FiUsers className="w-3 h-3 text-indigo-600" />
            </div>
            <span className="text-sm text-gray-600">
              {subject.teacher?.name || 'Sin profesor'}
            </span>
          </div>
          
          <a
            href={`/campus/subjects/${subject.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
          >
            <span>Gestionar</span>
            <FiBook className="w-3 h-3" />
          </a>
        </div>
        
        {/* Credits info */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{subject.credits} créditos</span>
            <span>Semestre {subject.semester || 1}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
