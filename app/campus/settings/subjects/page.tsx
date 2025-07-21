'use client';
import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiBook, FiUser, FiCalendar, FiX, FiUpload } from 'react-icons/fi';
import { User, Subject } from '@/app/lib/types';

interface SubjectFormData {
  name: string;
  code: string;
  description: string;
  year: number;
  semester: number;
  credits: number;
  teacher_id: string;
  image_url: string;
}

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  subject?: Subject | null;
}

function EditSubjectModal({ isOpen, onClose, onSave, subject }: EditSubjectModalProps) {
  const [formData, setFormData] = useState<SubjectFormData>({
    name: '',
    code: '',
    description: '',
    year: 1,
    semester: 1,
    credits: 3,
    teacher_id: '',
    image_url: ''
  });

  const [teachers, setTeachers] = useState<User[]>([]);

  // URLs de imágenes predefinidas para materias
  const predefinedImages = [
    { name: 'Matemática', url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Lengua/Literatura', url: 'https://images.unsplash.com/photo-1501525771695-688643efeea4?q=80&w=1073&auto=format&fit=crop&ixlib=rb-4.1.0' },
    { name: 'Historia', url: 'https://images.unsplash.com/photo-1718728593327-4f2bc080ca31?q=80&w=1139&auto=format&fit=crop&ixlib=rb-4.1.0' },
    { name: 'Biología', url: 'https://images.unsplash.com/photo-1706204787068-82cf617dc5c8?q=80&w=978&auto=format&fit=crop&ixlib=rb-4.1.0' },
    { name: 'Física', url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Química', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Programación', url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Arte', url: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Música', url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Educación Física', url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Geografía', url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
    { name: 'Filosofía', url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
  ];

  useEffect(() => {
    // Cargar profesores disponibles
    const loadTeachers = async () => {
      try {
        const response = await fetch('/api/admin/users?role=teacher');
        if (response.ok) {
          const result = await response.json();
          // La API devuelve { success: true, data: users }
          if (result.success && Array.isArray(result.data)) {
            setTeachers(result.data);
          } else {
            console.warn('Respuesta inesperada de la API:', result);
            setTeachers([]);
          }
        } else {
          console.error('Error response from API:', response.status);
          setTeachers([]);
        }
      } catch (error) {
        console.error('Error loading teachers:', error);
        setTeachers([]);
      }
    };

    if (isOpen) {
      loadTeachers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name,
        code: subject.code,
        description: subject.description || '',
        year: subject.year,
        semester: subject.semester || 1,
        credits: subject.credits,
        teacher_id: subject.teacher_id || '',
        image_url: subject.image_url || ''
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        year: 1,
        semester: 1,
        credits: 3,
        teacher_id: '',
        image_url: ''
      });
    }
  }, [subject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: subject?.id,
      ...formData
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">
            {subject ? 'Editar Materia' : 'Nueva Materia'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Materia *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ej: Matemática"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ej: MAT1"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción de la materia..."
            />
          </div>

          {/* Información académica */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año *
              </label>
              <select
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1° Año</option>
                <option value={2}>2° Año</option>
                <option value={3}>3° Año</option>
                <option value={4}>4° Año</option>
                <option value={5}>5° Año</option>
                <option value={6}>6° Año</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semestre
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1° Semestre</option>
                <option value={2}>2° Semestre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Créditos
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Profesor asignado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profesor Asignado
            </label>
            <select
              value={formData.teacher_id}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin profesor asignado</option>
              {Array.isArray(teachers) && teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>

          {/* Imagen de la materia */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen de la Materia
            </label>
            
            {/* URL personalizada */}
            <div className="mb-4">
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="URL de imagen personalizada"
              />
            </div>

            {/* Imágenes predefinidas */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">O elige una imagen predefinida:</p>
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {predefinedImages.map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: img.url })}
                    className={`relative group ${
                      formData.image_url === img.url ? 'ring-2 ring-blue-500' : ''
                    }`}
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-16 object-cover rounded-md hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-md flex items-center justify-center">
                      <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity text-center px-1">
                        {img.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview de la imagen */}
            {formData.image_url && (
              <div className="mt-2">
                <p className="text-sm text-gray-600 mb-1">Vista previa:</p>
                <img
                  src={formData.image_url}
                  alt="Preview"
                  className="w-32 h-20 object-cover rounded-md border"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Sin+Imagen';
                  }}
                />
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {subject ? 'Actualizar' : 'Crear'} Materia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubjectsManagementPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<number | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  // Datos de muestra inicial (serán reemplazados por datos reales)
  const mockSubjects: Subject[] = [];

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    let filtered = subjects;

    if (searchTerm) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (yearFilter !== 'all') {
      filtered = filtered.filter(subject => subject.year === yearFilter);
    }

    setFilteredSubjects(filtered);
  }, [subjects, searchTerm, yearFilter]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      } else {
        console.error('Error loading subjects:', response.statusText);
        setSubjects([]);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubject = () => {
    setEditingSubject(null);
    setShowModal(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setShowModal(true);
  };

  const handleSaveSubject = async (subjectData: any) => {
    try {
      if (editingSubject) {
        // Actualizar materia existente
        const response = await fetch(`/api/admin/subjects/${editingSubject.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subjectData),
        });

        if (response.ok) {
          const updatedSubject = await response.json();
          setSubjects(subjects.map(s => s.id === editingSubject.id ? updatedSubject : s));
        } else {
          const error = await response.json();
          alert(`Error al actualizar la materia: ${error.error}`);
        }
      } else {
        // Crear nueva materia
        const response = await fetch('/api/admin/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subjectData),
        });

        if (response.ok) {
          const newSubject = await response.json();
          setSubjects([...subjects, newSubject]);
        } else {
          const error = await response.json();
          alert(`Error al crear la materia: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Error al guardar la materia');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta materia?')) {
      try {
        const response = await fetch(`/api/admin/subjects/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setSubjects(subjects.filter(s => s.id !== id));
        } else {
          const error = await response.json();
          alert(`Error al eliminar la materia: ${error.error}`);
        }
      } catch (error) {
        console.error('Error deleting subject:', error);
        alert('Error al eliminar la materia');
      }
    }
  };

  return (
    <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Materias</h1>
          <p className="text-gray-600 mt-2">
            Administra las materias del campus, asigna profesores y configura años académicos
          </p>
        </div>

        {/* Stats Cards */}
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
                <FiUser className="w-6 h-6" />
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
              <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <FiBook className="w-6 h-6" />
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

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar materias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-80"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiBook className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            
            <button
              onClick={handleCreateSubject}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
            >
              <FiPlus className="w-4 h-4" />
              <span>Nueva Materia</span>
            </button>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Cargando materias...</div>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FiBook className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {subjects.length === 0 ? 'No hay materias creadas' : 'No se encontraron materias'}
              </h3>
              <p className="text-gray-500 text-center max-w-md">
                {subjects.length === 0 
                  ? 'Comienza creando tu primera materia para el campus virtual'
                  : 'Intenta ajustar los filtros de búsqueda'
                }
              </p>
              {subjects.length === 0 && (
                <button
                  onClick={handleCreateSubject}
                  className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Crear Primera Materia</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Materia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Año
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profesor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créditos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {subject.image_url && (
                            <img
                              src={subject.image_url}
                              alt={subject.name}
                              className="w-10 h-10 rounded-md object-cover mr-3"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/40x40/f3f4f6/9ca3af?text=?';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                            {subject.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {subject.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {subject.year}° Año
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.teacher?.name || (
                          <span className="text-gray-400 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subject.credits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditSubject(subject)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        <EditSubjectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveSubject}
          subject={editingSubject}
        />
      </div>
  );
}
