'use client';

import React, { useState, useEffect } from 'react';
import { FiBook, FiUsers, FiFileText, FiBarChart, FiFolder } from 'react-icons/fi';
import DocumentManager from '@/components/documents/DocumentManager';
import GradeSystem from '@/components/grades/GradeSystem';
import AssignmentSystem from '@/components/assignments/AssignmentSystem';
import NotificationCenter from '@/components/notifications/NotificationCenter';

interface SubjectDashboardProps {
  subjectId: string;
  userRole: 'admin' | 'teacher' | 'student';
  currentUserId: string;
}

interface Unit {
  id: string;
  title: string;
  unit_number: number;
  description?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

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

export default function SubjectDashboard({ 
  subjectId, 
  userRole, 
  currentUserId 
}: SubjectDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'assignments' | 'grades' | 'notifications'>('overview');
  const [subject, setSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos de la materia
  useEffect(() => {
    const loadSubjectData = async () => {
      try {
        setLoading(true);
        
        // Cargar información de la materia
        const subjectResponse = await fetch(`/api/subjects/${subjectId}`);
        if (subjectResponse.ok) {
          const subjectData = await subjectResponse.json();
          setSubject(subjectData);
        }

        // Cargar unidades
        const unitsResponse = await fetch(`/api/subjects/${subjectId}/units`);
        if (unitsResponse.ok) {
          const unitsData = await unitsResponse.json();
          setUnits(unitsData);
        }

      } catch (error) {
        console.error('Error loading subject data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubjectData();
  }, [subjectId]);

  const tabs = [
    { 
      id: 'overview', 
      name: 'Resumen', 
      icon: FiBook,
      description: 'Vista general de la materia'
    },
    { 
      id: 'documents', 
      name: 'Documentos', 
      icon: FiFolder,
      description: 'Materiales y recursos de estudio'
    },
    { 
      id: 'assignments', 
      name: 'Tareas', 
      icon: FiFileText,
      description: 'Gestión de tareas y entregas'
    },
    { 
      id: 'grades', 
      name: 'Calificaciones', 
      icon: FiBarChart,
      description: 'Sistema de evaluación y notas'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando materia...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Materia no encontrada</h2>
            <p className="text-gray-600">La materia que buscas no existe o no tienes acceso a ella.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header con información de la materia */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              {subject.image_url && (
                <img 
                  src={subject.image_url} 
                  alt={subject.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {subject.name}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{subject.code}</span>
                  <span>•</span>
                  <span>{subject.year}° Año - {subject.semester}° Semestre</span>
                  {subject.division && (
                    <>
                      <span>•</span>
                      <span>División {subject.division}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>{subject.credits} créditos</span>
                </div>
                {subject.teacher && (
                  <p className="text-sm text-blue-600 mt-1">
                    Profesor: {subject.teacher.name}
                  </p>
                )}
              </div>
            </div>

            {/* Centro de notificaciones */}
            <NotificationCenter 
              userId={currentUserId} 
              className="ml-4"
            />
          </div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Descripción de la materia */}
            {subject.description && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Descripción</h2>
                <p className="text-gray-700 leading-relaxed">{subject.description}</p>
              </div>
            )}

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <FiBook className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Unidades</p>
                    <p className="text-2xl font-semibold text-gray-900">{units.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <FiFileText className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tareas</p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <FiFolder className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Documentos</p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <FiUsers className="w-8 h-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">
                      {userRole === 'student' ? 'Mi Promedio' : 'Estudiantes'}
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Unidades de la materia */}
            {units.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Unidades del Curso</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {units.map((unit) => (
                    <div 
                      key={unit.id} 
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">
                          Unidad {unit.unit_number}
                        </h3>
                        <span className="text-xs text-gray-500">
                          #{unit.order_index}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-blue-600 mb-2">
                        {unit.title}
                      </h4>
                      {unit.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {unit.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Información adicional */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Información del Curso</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Detalles Académicos</h3>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li><strong>Código:</strong> {subject.code}</li>
                    <li><strong>Año:</strong> {subject.year}°</li>
                    <li><strong>Semestre:</strong> {subject.semester}°</li>
                    <li><strong>Créditos:</strong> {subject.credits}</li>
                    {subject.division && <li><strong>División:</strong> {subject.division}</li>}
                  </ul>
                </div>
                
                {subject.teacher && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Profesor</h3>
                    <div className="text-sm text-gray-700">
                      <p><strong>Nombre:</strong> {subject.teacher.name}</p>
                      <p><strong>Email:</strong> {subject.teacher.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <DocumentManager
            subjectId={subjectId}
            userRole={userRole}
            units={units}
            onDocumentUploaded={() => {
              // Recargar estadísticas si es necesario
            }}
          />
        )}

        {activeTab === 'assignments' && (
          <AssignmentSystem
            subjectId={subjectId}
            userRole={userRole}
            currentUserId={currentUserId}
            units={units}
            onAssignmentCreated={() => {
              // Recargar estadísticas si es necesario
            }}
          />
        )}

        {activeTab === 'grades' && (
          <GradeSystem
            subjectId={subjectId}
            userRole={userRole}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
}
