'use client';

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiBook, FiUser, FiCalendar, FiX, FiUpload } from 'react-icons/fi';
import { User, Subject } from '@/app/lib/types';
import SimpleModal from '@/components/common/SimpleModal';

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
  const [name, setName] = useState('');

  // Actualizar el nombre cuando cambie el subject
  useEffect(() => {
    if (subject) {
      setName(subject.name);
    } else {
      setName('');
    }
  }, [subject]);

  const handleSave = () => {
    if (name.trim()) {
      onSave({
        id: subject?.id,
        name: name.trim(),
        code: subject?.code || 'TEST',
        description: subject?.description || '',
        year: subject?.year || 1,
        semester: subject?.semester || 1,
        credits: subject?.credits || 3,
        teacher_id: subject?.teacher_id || '',
        image_url: subject?.image_url || ''
      });
      onClose();
    }
  };

  return (
    <SimpleModal 
      isOpen={isOpen} 
      onClose={onClose}
      title={subject ? `Editar: ${subject.name}` : 'Nueva Materia'}
    >
      <div style={{
        backgroundColor: '#d1fae5',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '24px',
        border: '2px solid #10b981'
      }}>
        <p style={{ color: '#047857', fontWeight: 'bold', textAlign: 'center' }}>
          🎉 ¡MODAL SUPER SIMPLE FUNCIONANDO!
        </p>
        <p style={{ color: '#6b7280', textAlign: 'center', marginTop: '8px' }}>
          Este modal debería ser completamente visible
        </p>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ 
          display: 'block', 
          fontWeight: 'bold', 
          marginBottom: '8px',
          color: '#374151'
        }}>
          Nombre de la Materia:
        </label>
        <input 
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '2px solid #d1d5db',
            borderRadius: '4px',
            fontSize: '16px',
            backgroundColor: 'white'
          }}
          placeholder="Ej: Matemática"
        />
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        justifyContent: 'flex-end'
      }}>
        <button 
          onClick={onClose}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Cancelar
        </button>
        <button 
          onClick={handleSave}
          style={{
            padding: '12px 24px',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          {subject ? 'Actualizar' : 'Crear'}
        </button>
      </div>
    </SimpleModal>
  );
}

export default function SubjectsManagementPage() {
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
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4" 
      style={{ 
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        // Cerrar si se hace clic en el fondo
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-md sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{
          backgroundColor: 'white',
          border: '2px solid #ccc',
          minHeight: '200px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con color de fondo visible */}
        <div className="flex items-center justify-between p-4 border-b" style={{ backgroundColor: '#f9fafb' }}>
          <h3 className="text-lg font-semibold text-gray-900">
            {subject ? `Editar: ${subject.name}` : 'Nueva Materia'}
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
            style={{ backgroundColor: '#e5e7eb' }}
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4" style={{ backgroundColor: 'white' }}>
          {/* Contenido de prueba visible */}
          <div style={{ backgroundColor: '#fef2f2', padding: '16px', border: '1px solid #f87171', borderRadius: '8px' }}>
            <p style={{ color: '#dc2626', fontWeight: 'bold' }}>
              ✅ Modal funcionando correctamente
            </p>
            <p style={{ color: '#374151', fontSize: '14px' }}>
              Materia: {subject?.name || 'Nueva materia'}
            </p>
          </div>

          {/* Información básica */}
          <div className="grid grid-cols-1 gap-4">
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
                style={{ backgroundColor: 'white', border: '2px solid #d1d5db' }}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
              placeholder="Descripción de la materia..."
            />
          </div>

          {/* Información académica */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Año *
              </label>
              <select
                required
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 sm:max-h-40 overflow-y-auto">
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
                      className="w-full h-12 sm:h-16 object-cover rounded-md hover:opacity-80 transition-opacity"
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
                  className="w-24 h-16 sm:w-32 sm:h-20 object-cover rounded-md border"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/800x400/f3f4f6/9ca3af?text=Sin+Imagen';
                  }}
                />
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t" style={{ backgroundColor: '#f9fafb', padding: '16px', margin: '16px -16px -16px -16px' }}>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-base font-medium"
              style={{ backgroundColor: 'white', border: '2px solid #d1d5db' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-white rounded-md transition-colors text-base font-medium"
              style={{ backgroundColor: '#3b82f6' }}
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
    console.log('�🚀🚀 CLICK EN EDITAR:', subject.name);
    alert(`Editando materia: ${subject.name}`);
    setEditingSubject(subject);
    setShowModal(true);
    console.log('✅✅✅ Modal state:', showModal, '-> true');
    console.log('📝 Materia seleccionada:', editingSubject);
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
    <div className="p-3 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Materias</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Administra las materias del campus, asigna profesores y configura años académicos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-blue-100 text-blue-600 mr-2 sm:mr-4">
                <FiBook className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Total Materias</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{subjects.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-green-100 text-green-600 mr-2 sm:mr-4">
                <FiUser className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Con Profesor</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {subjects.filter(s => s.teacher_id).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-yellow-100 text-yellow-600 mr-2 sm:mr-4">
                <FiCalendar className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Años Activos</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {[...new Set(subjects.map(s => s.year))].length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 rounded-full bg-purple-100 text-purple-600 mr-2 sm:mr-4">
                <FiBook className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Sin Asignar</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {subjects.filter(s => !s.teacher_id).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar materias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-80 text-sm sm:text-base"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiBook className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto text-sm sm:text-base"
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
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:from-blue-600 hover:to-blue-700 flex items-center justify-center space-x-2 transition-all text-sm sm:text-base"
            >
              <FiPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Materia</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500 text-sm sm:text-base">Cargando materias...</div>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-4">
              <FiBook className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 text-center">
                {subjects.length === 0 ? 'No hay materias creadas' : 'No se encontraron materias'}
              </h3>
              <p className="text-gray-500 text-center max-w-md text-sm sm:text-base">
                {subjects.length === 0 
                  ? 'Comienza creando tu primera materia para el campus virtual'
                  : 'Intenta ajustar los filtros de búsqueda'
                }
              </p>
              {subjects.length === 0 && (
                <button
                  onClick={handleCreateSubject}
                  className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-md hover:from-blue-600 hover:to-blue-700 flex items-center space-x-2 text-sm sm:text-base"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Crear Primera Materia</span>
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Materia
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Código
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Año
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Profesor
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                      Créditos
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-200">
                  {filteredSubjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50/50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {subject.image_url && (
                            <img
                              src={subject.image_url}
                              alt={subject.name}
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-md object-cover mr-2 sm:mr-3"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/40x40/f3f4f6/9ca3af?text=?';
                              }}
                            />
                          )}
                          <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-900">{subject.name}</div>
                            {subject.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs sm:hidden">
                                {subject.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 sm:hidden">
                              {subject.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                        {subject.code}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {subject.year}°
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                        {subject.teacher?.name || (
                          <span className="text-gray-400 italic">Sin asignar</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900 hidden lg:table-cell">
                        {subject.credits}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-1 sm:space-x-2">
                          <button
                            onClick={() => handleEditSubject(subject)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                          >
                            <FiEdit className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                          >
                            <FiTrash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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

        {/* Botón de prueba - solo para desarrollo */}
        <div className="fixed bottom-4 right-4 z-[10000]">
          <button
            onClick={() => {
              console.log('Abriendo modal de prueba');
              setShowModal(true);
              setEditingSubject(null);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors text-sm"
          >
            + Nueva
          </button>
        </div>
      </div>
  );
}
