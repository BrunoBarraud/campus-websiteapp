'use client';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiBook, FiFileText, FiBarChart, FiFolder, FiGrid, FiList, FiSearch } from 'react-icons/fi';
import SubjectDashboard from '@/components/subjects/SubjectDashboard';
import { AcademicUtils } from '@/constant/academic';

interface Subject {
  id: string;
  name: string;
  code: string;
  description?: string;
  year: number;
  semester: number;
  division?: string;
  credits: number;
  teacher_id: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  };
}

interface DashboardStats {
  totalSubjects: number;
  totalDocuments: number;
  totalAssignments: number;
  pendingAssignments: number;
  averageGrade: number;
  totalNotifications: number;
  unreadNotifications: number;
}

export default function CampusDashboardPage() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalSubjects: 0,
    totalDocuments: 0,
    totalAssignments: 0,
    pendingAssignments: 0,
    averageGrade: 0,
    totalNotifications: 0,
    unreadNotifications: 0
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');

  // Simulamos el usuario actual - en un caso real vendría de la autenticación
  const [currentUser, setCurrentUser] = useState({
    id: '',
    role: '' as 'admin' | 'teacher' | 'student' | '',
    name: '',
    email: '',
    year: 1 // Solo para estudiantes
  });
  const [userLoaded, setUserLoaded] = useState(false);

  // Cargar datos del usuario autenticado
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser({
            id: userData.id,
            role: userData.role,
            name: userData.name,
            email: userData.email,
            year: userData.year || 1
          });
          setUserLoaded(true);
        } else {
          console.error('Error loading user data:', response.status);
          setUserLoaded(true); // Marcar como cargado incluso si falla
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        setUserLoaded(true); // Marcar como cargado incluso si falla
      }
    };

    loadUserData();
  }, []);

  // Cargar materias según el rol del usuario
  useEffect(() => {
    // Solo cargar si tenemos datos del usuario
    if (!userLoaded || !currentUser.id || !currentUser.role) {
      return;
    }

    const loadSubjects = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading subjects for role:', currentUser.role, 'user:', currentUser.id);
        
        let apiUrl = '/api/subjects';
        
        // Determinar qué API usar según el rol
        if (currentUser.role === 'admin') {
          // Admin ve todas las materias
          apiUrl = '/api/admin/subjects';
        } else if (currentUser.role === 'teacher') {
          // Profesor ve solo sus materias asignadas
          apiUrl = `/api/teacher/subjects`;
        } else if (currentUser.role === 'student') {
          // Estudiante ve materias de su año
          apiUrl = `/api/student/subjects`;
        } else {
          console.log('⚠️ Invalid user role:', currentUser.role);
          setSubjects([]);
          setLoading(false);
          return;
        }
        
        console.log('📡 Fetching from:', apiUrl);
        const response = await fetch(apiUrl);
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('📊 API Response:', result);
          
          // Manejar diferentes formatos de respuesta
          let data = [];
          if (result.success && Array.isArray(result.data)) {
            // Formato de respuesta de student API: { success: true, data: [...] }
            data = result.data;
          } else if (Array.isArray(result)) {
            // Formato de respuesta de admin/teacher API: [...]
            data = result;
          } else if (result.subjects && Array.isArray(result.subjects)) {
            // Formato alternativo: { subjects: [...] }
            data = result.subjects;
          }
          
          console.log('📚 Processed data:', data);
          console.log('📚 Is array?', Array.isArray(data));
          console.log('📚 Length:', data?.length);
          
          setSubjects(Array.isArray(data) ? data : []);
          
          // Calcular estadísticas básicas
          const totalSubjects = Array.isArray(data) ? data.length : 0;
          console.log('📊 Total subjects for', currentUser.role, ':', totalSubjects);
          setStats(prev => ({
            ...prev,
            totalSubjects
          }));
        } else {
          console.error('Error response:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error details:', errorText);
          setSubjects([]);
        }
      } catch (error) {
        console.error('Error loading subjects:', error);
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, [userLoaded, currentUser.id, currentUser.role, currentUser.year]);

  // Filtrar materias
  const filteredSubjects = Array.isArray(subjects) ? subjects.filter(subject => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === 'all' || subject.year === selectedYear;
    const matchesSemester = selectedSemester === 'all' || subject.semester === selectedSemester;
    
    return matchesSearch && matchesYear && matchesSemester;
  }) : [];

  console.log('🔍 Filter debug:', {
    subjects: subjects?.length,
    filteredSubjects: filteredSubjects?.length,
    searchTerm,
    selectedYear,
    selectedSemester
  });

  // Si hay una materia seleccionada, mostrar su dashboard
  if (selectedSubject) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => setSelectedSubject(null)}
              className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>
        <SubjectDashboard
          subjectId={selectedSubject}
          userRole={currentUser.role as 'admin' | 'teacher' | 'student'}
          currentUserId={currentUser.id}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentUser.role === 'admin' && 'Gestión de Materias'}
                {currentUser.role === 'teacher' && 'Mis Materias'}
                {currentUser.role === 'student' && 'Mis Cursos'}
              </h1>
              <p className="text-gray-600 mt-1">
                Bienvenido, {currentUser.name} 
                {currentUser.role === 'admin' && ' (Administrador)'}
                {currentUser.role === 'teacher' && ' (Profesor)'}
                {currentUser.role === 'student' && ` (Estudiante - ${currentUser.year}° Año)`}
              </p>
              {currentUser.role === 'student' && (
                <p className="text-sm text-blue-600 mt-1">
                  Materias de {currentUser.year}° año
                </p>
              )}
              {currentUser.role === 'teacher' && (
                <p className="text-sm text-green-600 mt-1">
                  Materias asignadas: {stats.totalSubjects}
                </p>
              )}
              {currentUser.role === 'admin' && (
                <p className="text-sm text-purple-600 mt-1">
                  Total de materias en el sistema: {stats.totalSubjects}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => window.open('/campus/settings/subjects', '_blank')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Gestionar Materias</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
            {/* Estadísticas por rol */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Estadística 1 - Materias */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <FiBook className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {currentUser.role === 'admin' ? 'Total Materias' : 
                   currentUser.role === 'teacher' ? 'Mis Materias' : 'Mis Cursos'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSubjects}</p>
              </div>
            </div>
          </div>

          {/* Estadística 2 - Documentos */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <FiFolder className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  {currentUser.role === 'admin' ? 'Total Documentos' : 'Documentos'}
                </p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalDocuments}</p>
              </div>
            </div>
          </div>

          {/* Estadística 3 - Solo para estudiantes: Tareas Pendientes */}
          {currentUser.role === 'student' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <FiFileText className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tareas Pendientes</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.pendingAssignments}</p>
                </div>
              </div>
            </div>
          )}

          {/* Estadística 3 - Para admin/teacher: Total Asignaciones */}
          {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <FiFileText className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {currentUser.role === 'admin' ? 'Total Asignaciones' : 'Mis Asignaciones'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalAssignments}</p>
                </div>
              </div>
            </div>
          )}

          {/* Estadística 4 - Solo para estudiantes: Promedio General */}
          {currentUser.role === 'student' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <FiBarChart className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Promedio General</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.averageGrade > 0 ? stats.averageGrade.toFixed(1) : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estadística 4 - Para admin/teacher: Estudiantes activos */}
          {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <FiBarChart className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    {currentUser.role === 'admin' ? 'Usuarios Activos' : 'Estudiantes'}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {/* Placeholder - podríamos implementar esta métrica */}
                    -
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Búsqueda */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={
                    currentUser.role === 'admin' ? 'Buscar materias...' :
                    currentUser.role === 'teacher' ? 'Buscar en mis materias...' :
                    'Buscar en mis cursos...'
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              {/* Filtros solo para admin y teacher */}
              {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                <>
                  {/* Filtro por año */}
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos los años</option>
                    {AcademicUtils.getYearOptions().map(({ value, label }) => (
                      <option key={value} value={parseInt(value)}>{label}</option>
                    ))}
                  </select>

                  {/* Filtro por semestre */}
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todos los semestres</option>
                    {AcademicUtils.getSemesterOptions().map(({ value, label }) => (
                      <option key={value} value={parseInt(value)}>{label}</option>
                    ))}
                  </select>
                </>
              )}

              {/* Filtro de semestre para estudiantes */}
              {currentUser.role === 'student' && (
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los semestres</option>
                  {AcademicUtils.getSemesterOptions().map(({ value, label }) => (
                    <option key={value} value={parseInt(value)}>{label}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Cambio de vista */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FiGrid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FiList className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Lista de materias */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando materias...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="text-center py-12">
            <FiBook className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay materias disponibles</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedYear !== 'all' || selectedSemester !== 'all' ? (
                'No se encontraron materias con los filtros aplicados.'
              ) : currentUser.role === 'admin' ? (
                'No hay materias creadas en el sistema. Puedes crear la primera materia.'
              ) : currentUser.role === 'teacher' ? (
                'No tienes materias asignadas. Contacta al administrador para recibir asignaciones.'
              ) : (
                `No hay materias disponibles para ${currentUser.year}° año.`
              )}
            </p>
            {currentUser.role === 'admin' && !searchTerm && selectedYear === 'all' && selectedSemester === 'all' && (
              <button
                onClick={() => window.open('/campus/settings/subjects', '_blank')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Crear Primera Materia
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => setSelectedSubject(subject.id)}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 overflow-hidden"
              >
                {subject.image_url && (
                  <img
                    src={subject.image_url}
                    alt={subject.name}
                    className="w-full h-32 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600">{subject.code}</span>
                    <span className="text-xs text-gray-500">
                      {subject.year}°-{subject.semester}°
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {subject.name}
                  </h3>
                  {subject.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {subject.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{subject.credits} créditos</span>
                    {subject.teacher && (
                      <span>{subject.teacher.name}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredSubjects.map((subject) => (
                <div
                  key={subject.id}
                  onClick={() => setSelectedSubject(subject.id)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {subject.image_url && (
                      <img
                        src={subject.image_url}
                        alt={subject.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {subject.name}
                        </h3>
                        <span className="text-sm text-blue-600 font-medium">
                          {subject.code}
                        </span>
                      </div>
                      {subject.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {subject.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{subject.year}° Año - {subject.semester}° Semestre</span>
                        <span>{subject.credits} créditos</span>
                        {subject.teacher && (
                          <span>Prof. {subject.teacher.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
