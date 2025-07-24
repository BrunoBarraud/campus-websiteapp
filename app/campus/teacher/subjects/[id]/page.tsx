// 📚 Detalle de Materia - Vista del Profesor
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
  year: number;
  semester: number;
  credits: number;
  image_url: string | null;
}

interface Unit {
  id: string;
  unit_number: number;
  title: string;
  description: string;
  order_index: number;
  created_at: string;
}

interface Content {
  id: string;
  title: string;
  content_type: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  creator: {
    name: string;
    email: string;
  };
}

export default function SubjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'units' | 'documents'>('units');

  // Estados para crear unidad
  const [showCreateUnit, setShowCreateUnit] = useState(false);
  const [newUnit, setNewUnit] = useState({
    unit_number: '',
    title: '',
    description: ''
  });

  // Estados para crear contenido
  const [showCreateContent, setShowCreateContent] = useState(false);
  const [newContent, setNewContent] = useState({
    title: '',
    content: '',
    content_type: 'text',
    is_pinned: false
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'teacher') {
      router.push('/campus/login');
      return;
    }

    fetchSubjectData();
  }, [session, status, subjectId]);

  const fetchSubjectData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos de la materia (usando la API admin que ya filtra por profesor)
      const subjectResponse = await fetch(`/api/admin/subjects?teacher_id=${session?.user?.id}`);
      const subjectsData = await subjectResponse.json();
      
      if (!subjectResponse.ok) {
        throw new Error(subjectsData.error || 'Error al cargar la materia');
      }

      const currentSubject = subjectsData.find((s: Subject) => s.id === subjectId);
      if (!currentSubject) {
        throw new Error('Materia no encontrada o no tienes permisos');
      }

      setSubject(currentSubject);

      // Obtener unidades
      await fetchUnits();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar las unidades');
      }

      setUnits(data);
      if (data.length > 0 && !selectedUnitId) {
        setSelectedUnitId(data[0].id);
        fetchContents(data[0].id);
      }
    } catch (err: any) {
      console.error('Error fetching units:', err);
    }
  };

  const fetchContents = async (unitId: string) => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/units/${unitId}/contents`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar los contenidos');
      }

      setContents(data);
    } catch (err: any) {
      console.error('Error fetching contents:', err);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/subjects/${subjectId}/units`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUnit),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la unidad');
      }

      // Recargar unidades
      await fetchUnits();
      
      // Resetear formulario
      setNewUnit({ unit_number: '', title: '', description: '' });
      setShowCreateUnit(false);

    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateContent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUnitId) {
      setError('Selecciona una unidad primero');
      return;
    }

    try {
      const response = await fetch(`/api/subjects/${subjectId}/units/${selectedUnitId}/contents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newContent),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el contenido');
      }

      // Recargar contenidos
      await fetchContents(selectedUnitId);
      
      // Resetear formulario
      setNewContent({ title: '', content: '', content_type: 'text', is_pinned: false });
      setShowCreateContent(false);

    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnitId(unitId);
    fetchContents(unitId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando materia...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a mis materias
          </button>
          
          {subject && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {subject.name}
              </h1>
              <div className="flex items-center space-x-4 text-gray-600">
                <span>{subject.code}</span>
                <span>•</span>
                <span>{subject.year}° Año - {subject.semester}° Semestre</span>
                <span>•</span>
                <span>{subject.credits} créditos</span>
              </div>
              {subject.description && (
                <p className="mt-2 text-gray-700">{subject.description}</p>
              )}
            </div>
          )}
          
          {/* Botones de navegación rápida */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => router.push(`/campus/teacher/subjects/${subjectId}/assignments`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Gestionar Tareas
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('units')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'units'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Unidades y Contenidos
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-6 py-3 font-medium text-sm border-b-2 ${
                  activeTab === 'documents'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Documentos
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'units' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Unidades (Left Panel) */}
                <div className="lg:col-span-1">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Unidades</h3>
                    <button
                      onClick={() => setShowCreateUnit(true)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      + Nueva
                    </button>
                  </div>

                  <div className="space-y-2">
                    {units.map((unit) => (
                      <div
                        key={unit.id}
                        onClick={() => handleUnitSelect(unit.id)}
                        className={`p-3 rounded-lg cursor-pointer border transition-colors ${
                          selectedUnitId === unit.id
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          Unidad {unit.unit_number}: {unit.title}
                        </div>
                        {unit.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {unit.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contenidos (Right Panel) */}
                <div className="lg:col-span-2">
                  {selectedUnitId ? (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Contenidos</h3>
                        <button
                          onClick={() => setShowCreateContent(true)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                        >
                          + Agregar Contenido
                        </button>
                      </div>

                      <div className="space-y-4">
                        {contents.map((content) => (
                          <div key={content.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{content.title}</h4>
                              <div className="flex items-center space-x-2">
                                {content.is_pinned && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                    Fijado
                                  </span>
                                )}
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                  {content.content_type}
                                </span>
                              </div>
                            </div>
                            <div className="text-gray-700 mb-2">
                              {content.content}
                            </div>
                            <div className="text-sm text-gray-500">
                              Por {content.creator.name} • {new Date(content.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}

                        {contents.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No hay contenidos en esta unidad aún.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Selecciona una unidad para ver sus contenidos.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Documentos</h3>
                  <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                    + Subir Documento
                  </button>
                </div>
                <div className="text-center py-8 text-gray-500">
                  Funcionalidad de documentos en desarrollo...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal para crear unidad */}
        {showCreateUnit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Nueva Unidad</h3>
              <form onSubmit={handleCreateUnit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Unidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newUnit.unit_number}
                    onChange={(e) => setNewUnit({...newUnit, unit_number: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newUnit.title}
                    onChange={(e) => setNewUnit({...newUnit, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={newUnit.description}
                    onChange={(e) => setNewUnit({...newUnit, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Crear Unidad
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateUnit(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal para crear contenido */}
        {showCreateContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Contenido</h3>
              <form onSubmit={handleCreateContent}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título
                  </label>
                  <input
                    type="text"
                    value={newContent.title}
                    onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Contenido
                  </label>
                  <select
                    value={newContent.content_type}
                    onChange={(e) => setNewContent({...newContent, content_type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="text">Texto</option>
                    <option value="video">Video</option>
                    <option value="document">Documento</option>
                    <option value="link">Enlace</option>
                    <option value="assignment">Tarea</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenido
                  </label>
                  <textarea
                    value={newContent.content}
                    onChange={(e) => setNewContent({...newContent, content: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newContent.is_pinned}
                      onChange={(e) => setNewContent({...newContent, is_pinned: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Fijar contenido</span>
                  </label>
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Crear Contenido
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateContent(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
