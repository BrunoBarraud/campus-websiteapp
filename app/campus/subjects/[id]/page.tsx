'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Subject, SubjectUnit, SubjectContent, User, UserRole } from '@/app/lib/types';
import { UnitModal, ContentModal, DocumentModal } from '@/components/modals/SubjectModals';
import Nav from '@/components/Home/Navbar/Nav';
import { FiPlus, FiEdit, FiTrash2, FiFile, FiBookOpen, FiCalendar, FiUsers, FiArrowLeft, FiUpload, FiFolder } from 'react-icons/fi';
import { BsPinFill } from 'react-icons/bs';

// Mock data para desarrollo
const mockSubject: Subject = {
  id: '1',
  name: 'Matemática I',
  code: 'MAT1',
  description: 'Introducción a las matemáticas para primer año',
  year: 1,
  semester: 1,
  credits: 6,
  teacher_id: 'teacher1',
  teacher: {
    id: 'teacher1',
    email: 'prof.martinez@ipdvs.edu.ar',
    name: 'Prof. María Martínez',
    role: 'teacher' as UserRole,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01'
};

const mockUnits: SubjectUnit[] = [
  {
    id: '1',
    subject_id: '1',
    unit_number: 1,
    title: 'Números Reales y Operaciones',
    description: 'Introducción a los números reales, operaciones básicas y propiedades',
    order_index: 1,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    documents: [
      {
        id: 'doc1',
        title: 'Teoría de Números Reales',
        description: 'Material teórico sobre números reales',
        file_name: 'teoria_numeros_reales.pdf',
        file_url: '/files/teoria_numeros_reales.pdf',
        file_type: 'application/pdf',
        file_size: 1024000,
        subject_id: '1',
        unit_id: '1',
        uploaded_by: 'teacher1',
        is_public: true,
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }
    ]
  },
  {
    id: '2',
    subject_id: '1',
    unit_number: 2,
    title: 'Álgebra Básica',
    description: 'Ecuaciones lineales, sistemas de ecuaciones y polinomios',
    order_index: 2,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    documents: []
  }
];

const mockContent: SubjectContent[] = [
  {
    id: 'content1',
    subject_id: '1',
    content_type: 'announcement',
    title: '📢 Examen Parcial - Unidad 1',
    content: 'El examen parcial de la Unidad 1 se realizará el próximo viernes. Repasar todos los ejercicios de la guía práctica.',
    unit_id: '1',
    created_by: 'teacher1',
    creator: {
      id: 'teacher1',
      email: 'prof.martinez@ipdvs.edu.ar',
      name: 'Prof. María Martínez',
      role: 'teacher' as UserRole,
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01'
    },
    is_pinned: true,
    is_active: true,
    created_at: '2024-01-15',
    updated_at: '2024-01-15'
  }
];

const mockCurrentUser: User = {
  id: 'admin1',
  email: 'brunobarraud13@gmail.com',
  name: 'Bruno Barraud',
  role: 'admin' as UserRole,
  is_active: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01'
};

interface Modal {
  type: 'unit' | 'content' | 'document' | null;
  data?: any;
}

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.id as string;

  const [subject, setSubject] = useState<Subject>(mockSubject);
  const [units, setUnits] = useState<SubjectUnit[]>(mockUnits);
  const [content, setContent] = useState<SubjectContent[]>(mockContent);
  const [currentUser, setCurrentUser] = useState<User>(mockCurrentUser);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'units' | 'content'>('overview');
  const [modal, setModal] = useState<Modal>({ type: null });

  // Verificar permisos
  const canEdit = currentUser?.role === 'admin' || 
    (currentUser?.role === 'teacher' && subject?.teacher_id === currentUser?.id);

  const handleCreateUnit = () => {
    setModal({ type: 'unit', data: null });
  };

  const handleEditUnit = (unit: SubjectUnit) => {
    setModal({ type: 'unit', data: unit });
  };

  const handleCreateContent = () => {
    setModal({ type: 'content', data: null });
  };

  const handleUploadDocument = (unitId?: string) => {
    setModal({ type: 'document', data: { unitId } });
  };

  const handleSaveUnit = (unitData: Partial<SubjectUnit>) => {
    console.log('Guardando unidad:', unitData);
    // Aquí integraremos con el servicio real
    alert('Unidad guardada correctamente');
  };

  const handleSaveContent = (contentData: Partial<SubjectContent>) => {
    console.log('Guardando contenido:', contentData);
    // Aquí integraremos con el servicio real
    alert('Contenido guardado correctamente');
  };

  const handleSaveDocument = (documentData: any) => {
    console.log('Guardando documento:', documentData);
    // Aquí integraremos con el servicio real
    alert('Documento subido correctamente');
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement': return '📢';
      case 'resource': return '📚';
      case 'assignment': return '📝';
      case 'note': return '📄';
      default: return '📄';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-gray-50 mt-[12vh]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.back()}
                  className="flex items-center text-gray-600 hover:text-gray-900"
                >
                  <FiArrowLeft className="w-5 h-5 mr-2" />
                  Volver
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {subject.code} • {subject.year}° Año • {subject.credits} Créditos
                  </p>
                  {subject.teacher && (
                    <p className="text-sm text-blue-600 mt-1 flex items-center">
                      <FiUsers className="w-4 h-4 mr-1" />
                      {subject.teacher.name}
                    </p>
                  )}
                </div>
              </div>
              
              {canEdit && (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCreateUnit}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Nueva Unidad
                  </button>
                  <button
                    onClick={handleCreateContent}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Nuevo Contenido
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Información General', icon: FiBookOpen },
              { id: 'units', name: 'Unidades', icon: FiFolder },
              { id: 'content', name: 'Contenido', icon: FiFile }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Descripción */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Descripción</h3>
              <p className="text-gray-700">
                {subject.description || 'No hay descripción disponible para esta materia.'}
              </p>
            </div>

            {/* Información del curso */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Curso</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{units.length}</div>
                  <div className="text-sm text-gray-600">Unidades</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{content.length}</div>
                  <div className="text-sm text-gray-600">Publicaciones</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {units.reduce((acc, unit) => acc + (unit.documents?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Documentos</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{subject.credits}</div>
                  <div className="text-sm text-gray-600">Créditos</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'units' && (
          <div className="space-y-6">
            {units.map((unit) => (
              <div key={unit.id} className="bg-white rounded-lg shadow">
                {/* Header de la unidad */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Unidad {unit.unit_number}: {unit.title}
                      </h3>
                      {unit.description && (
                        <p className="text-sm text-gray-600 mt-1">{unit.description}</p>
                      )}
                    </div>
                    {canEdit && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleUploadDocument(unit.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <FiUpload className="w-4 h-4 mr-1" />
                          Subir Archivo
                        </button>
                        <button
                          onClick={() => handleEditUnit(unit)}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Documentos de la unidad */}
                <div className="px-6 py-4">
                  {unit.documents && unit.documents.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-900">Documentos</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {unit.documents.map((doc) => (
                          <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 text-sm">{doc.title}</h5>
                                {doc.description && (
                                  <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                                )}
                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                  <FiFile className="w-3 h-3 mr-1" />
                                  {doc.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                                  {doc.file_size && (
                                    <span className="ml-2">• {formatFileSize(doc.file_size)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                Descargar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FiFile className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No hay documentos en esta unidad</p>
                      {canEdit && (
                        <button
                          onClick={() => handleUploadDocument(unit.id)}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          Subir primer documento
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {units.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <FiFolder className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay unidades</h3>
                <p className="text-gray-600 mb-4">Comienza creando la primera unidad de la materia.</p>
                {canEdit && (
                  <button
                    onClick={handleCreateUnit}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Crear Primera Unidad
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-4">
            {content.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{getContentTypeIcon(item.content_type)}</span>
                      <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                      {item.is_pinned && (
                        <BsPinFill className="w-4 h-4 ml-2 text-yellow-500" />
                      )}
                    </div>
                    {item.content && (
                      <p className="text-gray-700 mt-2">{item.content}</p>
                    )}
                    <div className="flex items-center text-sm text-gray-500 mt-3">
                      <span>Por {item.creator?.name}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      {item.unit_id && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Unidad {units.find(u => u.id === item.unit_id)?.unit_number}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex space-x-2 ml-4">
                      <button className="text-gray-600 hover:text-gray-800">
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {content.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <FiFile className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay contenido</h3>
                <p className="text-gray-600 mb-4">Comienza creando el primer contenido de la materia.</p>
                {canEdit && (
                  <button
                    onClick={handleCreateContent}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Crear Primer Contenido
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      <UnitModal
        isOpen={modal.type === 'unit'}
        onClose={() => setModal({ type: null })}
        onSave={handleSaveUnit}
        unit={modal.data}
        subjectId={subjectId}
      />

      <ContentModal
        isOpen={modal.type === 'content'}
        onClose={() => setModal({ type: null })}
        onSave={handleSaveContent}
        subjectId={subjectId}
        units={units}
      />

      <DocumentModal
        isOpen={modal.type === 'document'}
        onClose={() => setModal({ type: null })}
        onSave={handleSaveDocument}
        subjectId={subjectId}
        unitId={modal.data?.unitId}
      />
      </div>
    </>
  );
}
