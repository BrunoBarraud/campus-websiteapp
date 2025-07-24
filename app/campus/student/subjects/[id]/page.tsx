// 📚 Vista de Materia para Estudiantes
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';

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

interface Document {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  unit_id: string | null;
  created_at: string;
  uploader: {
    name: string;
    email: string;
  };
}

export default function StudentSubjectDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subjectId = params.id as string;

  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [contents, setContents] = useState<Content[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'units' | 'documents'>('units');

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'student') {
      router.push('/campus/login');
      return;
    }

    fetchData();
  }, [session, status, subjectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Obtener unidades
      await fetchUnits();
      
      // Obtener documentos
      await fetchDocuments();

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

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/subjects/${subjectId}/documents`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al cargar los documentos');
      }

      setDocuments(data);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleUnitSelect = (unitId: string) => {
    setSelectedUnitId(unitId);
    fetchContents(unitId);
  };

  const handleDownload = (document: Document) => {
    // Abrir el archivo en una nueva ventana/pestaña
    window.open(document.file_url, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'document':
        return '📄';
      case 'link':
        return '🔗';
      case 'assignment':
        return '📝';
      default:
        return '📖';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando contenido...</p>
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
          
          {/* Botón de navegación a tareas */}
          <div className="mb-4">
            <button
              onClick={() => router.push(`/campus/student/subjects/${subjectId}/assignments`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ver Mis Tareas
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
                Materiales
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'units' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Unidades (Left Panel) */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Unidades</h3>

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

                    {units.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No hay unidades disponibles aún.
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenidos (Right Panel) */}
                <div className="lg:col-span-2">
                  {selectedUnitId ? (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contenidos</h3>

                      <div className="space-y-4">
                        {contents.map((content) => (
                          <div key={content.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getContentTypeIcon(content.content_type)}</span>
                                <h4 className="font-medium text-gray-900">{content.title}</h4>
                              </div>
                              <div className="flex items-center space-x-2">
                                {content.is_pinned && (
                                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                    📌 Fijado
                                  </span>
                                )}
                                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded capitalize">
                                  {content.content_type}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-gray-700 mb-3 whitespace-pre-wrap">
                              {content.content}
                            </div>
                            
                            {content.content_type === 'link' && (
                              <div className="mb-3">
                                <a
                                  href={content.content}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                >
                                  🔗 Abrir enlace
                                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              </div>
                            )}
                            
                            <div className="text-sm text-gray-500">
                              Por {content.creator.name} • {new Date(content.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        ))}

                        {contents.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            No hay contenidos disponibles en esta unidad.
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Materiales de Estudio</h3>
                
                <div className="grid gap-4">
                  {documents.map((document) => (
                    <div key={document.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{document.title}</h4>
                          {document.description && (
                            <p className="text-gray-600 text-sm mb-2">{document.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>📄 {document.file_name}</span>
                            <span>📦 {formatFileSize(document.file_size)}</span>
                            <span>📅 {new Date(document.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Subido por: {document.uploader.name}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownload(document)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          📥 Descargar
                        </button>
                      </div>
                    </div>
                  ))}

                  {documents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No hay materiales disponibles aún.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
