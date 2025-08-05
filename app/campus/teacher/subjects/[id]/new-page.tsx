// 📚 Nueva página simplificada para materias del profesor
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import UnitAccordion from '../../../../../components/teacher/UnitAccordion';
import LoadingSpinner from '../../../../../components/ui/LoadingSpinner';

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  year: number;
  division?: string;
  image_url: string | null;
}

export default function TeacherSubjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || !session.user) {
      router.push('/campus/login');
      return;
    }

    if (session.user.role !== 'teacher') {
      router.push('/campus/dashboard');
      return;
    }

    fetchSubject();
  }, [session, status, router, subjectId]);

  const fetchSubject = async () => {
    try {
      setLoading(true);
      setError('');

      // Verificar que el profesor tenga acceso a esta materia
      const response = await fetch('/api/teacher/subjects');
      
      if (!response.ok) {
        throw new Error('Error al cargar las materias');
      }

      const subjectsData = await response.json();
      const currentSubject = subjectsData.find((s: Subject) => s.id === subjectId);
      
      if (!currentSubject) {
        throw new Error('Materia no encontrada o no tienes permisos para acceder a ella');
      }

      setSubject(currentSubject);

    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching subject:', err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Cargando materia..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border-2 border-red-100 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Volver
            </button>
            <button
              onClick={fetchSubject}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No subject found
  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg border-2 border-yellow-100 text-center max-w-md">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-search text-yellow-500 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Materia no encontrada</h2>
          <p className="text-gray-600 mb-4">No se pudo cargar la información de la materia solicitada.</p>
          <button
            onClick={() => router.push('/campus/dashboard')}
            className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Ir al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-rose-50 to-yellow-100 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button 
              onClick={() => router.push('/campus/dashboard')}
              className="hover:text-yellow-600 transition-colors"
            >
              Dashboard
            </button>
            <i className="fas fa-chevron-right text-xs"></i>
            <button 
              onClick={() => router.push('/campus/teacher/subjects')}
              className="hover:text-yellow-600 transition-colors"
            >
              Mis Materias
            </button>
            <i className="fas fa-chevron-right text-xs"></i>
            <span className="text-gray-800 font-medium">{subject.name}</span>
          </div>
        </nav>

        {/* Subject Info Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg border-2 border-yellow-100 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {subject.image_url ? (
                <img 
                  src={subject.image_url} 
                  alt={subject.name}
                  className="w-16 h-16 rounded-lg object-cover border-2 border-yellow-200"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-100 to-rose-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-book text-yellow-600 text-xl"></i>
                </div>
              )}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-800">{subject.name}</h1>
                  <span className="bg-gradient-to-r from-yellow-100 to-rose-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                    {subject.code}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{subject.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span><i className="fas fa-graduation-cap mr-1"></i>{subject.year}° Año{subject.division ? ` "${subject.division}"` : ''}</span>
                  <span><i className="fas fa-book mr-1"></i>{subject.code}</span>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/campus/teacher/subjects/${subjectId}/assignments`)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                <i className="fas fa-tasks mr-1"></i>
                Tareas
              </button>
              <button
                onClick={() => router.push(`/campus/teacher/subjects/${subjectId}/students`)}
                className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
              >
                <i className="fas fa-users mr-1"></i>
                Estudiantes
              </button>
            </div>
          </div>
        </div>

        {/* Unit Accordion Component */}
        <UnitAccordion 
          subjectId={subjectId} 
          subjectName={subject.name}
        />
      </div>
    </div>
  );
}
