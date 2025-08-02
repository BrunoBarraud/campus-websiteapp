'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiUpload, FiFile, FiDownload, FiTrash2, FiFolder, FiSearch, FiX, FiPlus } from 'react-icons/fi';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface Document {
  id: string;
  title: string;
  description?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  subject_id: string;
  unit_id?: string;
  uploaded_by: string;
  year: number;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  uploader?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    title: string;
    unit_number: number;
  };
}

interface Unit {
  id: string;
  title: string;
  unit_number: number;
}

interface DocumentManagerProps {
  subjectId: string;
  userRole: 'admin' | 'teacher' | 'student';
  units: Unit[];
  onDocumentUploaded?: () => void;
}

interface UploadProgress {
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

export default function DocumentManager({ 
  subjectId, 
  userRole, 
  units,
  onDocumentUploaded 
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    status: 'idle'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    unit_id: '',
    is_public: true
  });

  // Cargar documentos
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/subjects/${subjectId}/documents`);
      
      if (!response.ok) {
        throw new Error('Error al cargar documentos');
      }

      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Filtrar y ordenar documentos
  const filteredDocuments = documents
    .filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnit = filterUnit === 'all' || doc.unit_id === filterUnit;
      const matchesType = filterType === 'all' || doc.file_type.includes(filterType);
      
      return matchesSearch && matchesUnit && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'size':
          return b.file_size - a.file_size;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Manejar selección de archivos
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
    
    if (files.length > 0 && !uploadForm.title) {
      setUploadForm(prev => ({
        ...prev,
        title: files[0].name.split('.')[0]
      }));
    }
  };

  // Manejar drag & drop
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setSelectedFiles(files);
    
    if (files.length > 0 && !uploadForm.title) {
      setUploadForm(prev => ({
        ...prev,
        title: files[0].name.split('.')[0]
      }));
    }
  };

  // Subir documentos
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setUploadProgress({ progress: 0, status: 'uploading' });

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const formData = new FormData();

        formData.append('file', file);
        formData.append('title', uploadForm.title || file.name);
        formData.append('description', uploadForm.description);
        formData.append('subject_id', subjectId);
        if (uploadForm.unit_id) {
          formData.append('unit_id', uploadForm.unit_id);
        }
        formData.append('is_public', uploadForm.is_public.toString());

        const response = await fetch('/api/upload-document', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al subir documento');
        }

        const progress = Math.round(((i + 1) / selectedFiles.length) * 100);
        setUploadProgress({ progress, status: 'uploading' });
      }

      setUploadProgress({ progress: 100, status: 'success' });
      
      // Resetear formulario
      setSelectedFiles([]);
      setUploadForm({
        title: '',
        description: '',
        unit_id: '',
        is_public: true
      });
      
      // Recargar documentos
      await loadDocuments();
      if (onDocumentUploaded) onDocumentUploaded();
      
      setTimeout(() => {
        setUploadModal(false);
        setUploadProgress({ progress: 0, status: 'idle' });
      }, 1000);

    } catch (error: any) {
      console.error('Error uploading documents:', error);
      setUploadProgress({ 
        progress: 0, 
        status: 'error',
        error: error.message 
      });
    }
  };

  // Descargar documento
  const handleDownload = (doc: Document) => {
    window.open(doc.file_url, '_blank');
  };

  // Eliminar documento
  const handleDelete = async (docId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este documento?')) return;

    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar documento');
      }

      setDocuments(prev => prev.filter(doc => doc.id !== docId));
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Error al eliminar el documento');
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Obtener icono por tipo de archivo
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    return '📁';
  };

  // Renderizar modal de subida
  const renderUploadModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Subir Documentos</h3>
          <button 
            onClick={() => setUploadModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Área de drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              selectedFiles.length > 0 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            {selectedFiles.length > 0 ? (
              <div className="space-y-2">
                <FiFile className="w-8 h-8 mx-auto text-green-600" />
                <div>
                  <p className="font-medium text-green-700">
                    {selectedFiles.length} archivo(s) seleccionado(s)
                  </p>
                  <div className="text-sm text-gray-600 mt-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>{file.name}</span>
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <FiUpload className="w-8 h-8 mx-auto text-gray-400" />
                <div>
                  <p className="text-gray-600">Arrastra archivos aquí</p>
                  <p className="text-sm text-gray-500">o</p>
                </div>
                <label className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-700">
                  Seleccionar archivos
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Formulario */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título del documento"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe el contenido del documento..."
              />
            </div>

            <div>
              <Label htmlFor="unit">Unidad (opcional)</Label>
              <select
                id="unit"
                value={uploadForm.unit_id}
                onChange={(e) => setUploadForm(prev => ({ ...prev, unit_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Sin unidad específica</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Unidad {unit.unit_number}: {unit.title}
                  </option>
                ))}
              </select>
            </div>

            {userRole !== 'student' && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={uploadForm.is_public}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="is_public" className="ml-2">
                  Documento público (visible para todos los estudiantes)
                </Label>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {uploadProgress.status === 'uploading' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subiendo...</span>
                <span>{uploadProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
            </div>
          )}

          {uploadProgress.status === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{uploadProgress.error}</p>
            </div>
          )}

          {uploadProgress.status === 'success' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">¡Documentos subidos exitosamente!</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setUploadModal(false)}
              disabled={uploadProgress.status === 'uploading'}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || !uploadForm.title.trim() || uploadProgress.status === 'uploading'}
            >
              {uploadProgress.status === 'uploading' ? 'Subiendo...' : 'Subir Documentos'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar documento
  const renderDocument = (doc: Document) => {
    const canDelete = userRole === 'admin' || 
                     (userRole === 'teacher' && doc.uploaded_by) ||
                     (userRole === 'student' && doc.uploaded_by);

    if (viewMode === 'list') {
      return (
        <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getFileIcon(doc.file_type)}</span>
            <div>
              <h4 className="font-medium text-gray-900">{doc.title}</h4>
              <p className="text-sm text-gray-500">
                {doc.file_name} • {formatFileSize(doc.file_size)}
                {doc.unit && ` • Unidad ${doc.unit.unit_number}`}
              </p>
              {doc.description && (
                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDownload(doc)}
            >
              <FiDownload className="w-4 h-4" />
            </Button>
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(doc.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <FiTrash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={doc.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <span className="text-3xl">{getFileIcon(doc.file_type)}</span>
          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete(doc.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <FiTrash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{doc.title}</h4>
        
        {doc.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
        )}
        
        <div className="text-xs text-gray-500 mb-3">
          <p>{doc.file_name}</p>
          <p>{formatFileSize(doc.file_size)}</p>
          {doc.unit && <p>Unidad {doc.unit.unit_number}: {doc.unit.title}</p>}
          <p>Subido: {new Date(doc.created_at).toLocaleDateString()}</p>
        </div>
        
        <Button
          className="w-full"
          onClick={() => handleDownload(doc)}
        >
          <FiDownload className="w-4 h-4 mr-2" />
          Descargar
        </Button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documentos y Materiales</h2>
          <p className="text-gray-600">
            {documents.length} documento{documents.length !== 1 ? 's' : ''} disponible{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {(userRole === 'admin' || userRole === 'teacher') && (
          <Button onClick={() => setUploadModal(true)}>
            <FiPlus className="w-4 h-4 mr-2" />
            Subir Documentos
          </Button>
        )}
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas las unidades</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                Unidad {unit.unit_number}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Fecha</option>
            <option value="name">Nombre</option>
            <option value="size">Tamaño</option>
          </select>
          
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <FiFolder className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Lista de documentos */}
      {filteredDocuments.length === 0 ? (
        <div className="text-center py-12">
          <FiFile className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay documentos</h3>
          <p className="text-gray-600">
            {searchTerm || filterUnit !== 'all' 
              ? 'No se encontraron documentos con los filtros aplicados.' 
              : 'Aún no se han subido documentos para esta materia.'
            }
          </p>
          {(userRole === 'admin' || userRole === 'teacher') && !searchTerm && filterUnit === 'all' && (
            <Button
              className="mt-4"
              onClick={() => setUploadModal(true)}
            >
              <FiPlus className="w-4 h-4 mr-2" />
              Subir primer documento
            </Button>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
        }>
          {filteredDocuments.map(renderDocument)}
        </div>
      )}

      {/* Modal de subida */}
      {uploadModal && renderUploadModal()}
    </div>
  );
}
