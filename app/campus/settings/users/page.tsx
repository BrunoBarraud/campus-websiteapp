"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from "react";
import { FiUsers, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiDownload, FiUpload, FiFileText } from 'react-icons/fi';
import AdminProtected from '@/components/auth/AdminProtected';
import Pagination from '@/components/ui/Pagination';
import { yearHasDivisions } from '@/app/lib/utils/divisions';

// Definir tipos
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  year?: number;
  division?: string | null;
  is_active: boolean;
  created_at: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  startItem: number;
  endItem: number;
}

interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: PaginationInfo;
  filters: {
    role: string;
    search: string;
    sortBy: string;
    sortOrder: string;
    includeInactive: boolean;
  };
}

// Modal para editar/crear usuario
function EditUserModal({ 
  user, 
  isOpen, 
  onClose, 
  onSave 
}: { 
  user: User | null; 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (userData: Partial<User>) => void; 
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student' as 'admin' | 'teacher' | 'student',
    year: undefined as number | undefined,
    division: '' as string,
    recalcEnrollments: true,
    is_active: true
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        division: user.division || '',
        recalcEnrollments: true,
        is_active: user.is_active
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'student',
        year: undefined,
        division: '',
        recalcEnrollments: true,
        is_active: true
      });
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          backgroundColor: 'white',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '28rem',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
            {user ? 'Editar Usuario' : 'Crear Usuario'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              padding: '0.5rem',
              backgroundColor: '#f3f4f6',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Nombre completo
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                role: e.target.value as 'admin' | 'teacher' | 'student',
                year: e.target.value === 'student' ? prev.year : undefined,
                division: e.target.value === 'student' ? prev.division : ''
              }))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            >
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                Año académico
              </label>
              <select
                value={formData.year || ''}
                onChange={(e) => {
                  const nextYear = e.target.value ? parseInt(e.target.value) : undefined;
                  setFormData(prev => ({
                    ...prev,
                    year: nextYear,
                    division: nextYear && !yearHasDivisions(nextYear) ? '' : prev.division
                  }));
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                <option value="">Seleccionar año</option>
                {[1, 2, 3, 4, 5, 6].map(year => (
                  <option key={year} value={year}>{year}° Año</option>
                ))}
              </select>
            </div>
          )}

          {formData.role === 'student' && formData.year && yearHasDivisions(formData.year) && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                División
              </label>
              <select
                value={formData.division}
                onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  fontSize: '1rem'
                }}
              >
                <option value="">Seleccionar división</option>
                <option value="A">A</option>
                <option value="B">B</option>
              </select>
            </div>
          )}

          {formData.role === 'student' && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                <input
                  type="checkbox"
                  checked={formData.recalcEnrollments}
                  onChange={(e) => setFormData(prev => ({ ...prev, recalcEnrollments: e.target.checked }))}
                  style={{ marginRight: '0.5rem' }}
                />
                Recalcular materias del alumno
              </label>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                style={{ marginRight: '0.5rem' }}
              />
              Usuario activo
            </label>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '0.5rem 1rem',
                background: 'linear-gradient(to right, #f59e0b, #881337)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {user ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsersPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para importación/exportación
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados de paginación
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
    startItem: 0,
    endItem: 0
  });
  
  // Estados de ordenamiento (para futura implementación)
  const [sortBy] = useState('name');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');

  // Función para construir la URL de la API con parámetros
  const buildApiUrl = (page: number = pagination.currentPage, limit: number = pagination.itemsPerPage) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    if (filterRole !== 'all') {
      params.append('role', filterRole);
    }

    if (searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    }

    return `/api/users?${params.toString()}`;
  };

  // Fetch users con paginación
  const fetchUsers = async (page: number = pagination.currentPage, limit: number = pagination.itemsPerPage) => {
    try {
      setLoading(true);
      const url = buildApiUrl(page, limit);
      console.log('🔄 Fetching users from:', url);
      
      const response = await fetch(url);
      if (response.ok) {
        const result: UsersResponse = await response.json();
        console.log('✅ Users response:', result);
        
        setUsers(result.data || []);
        setPagination(result.pagination);
      } else {
        console.error('❌ Error fetching users:', response.status);
        setUsers([]);
        setPagination(prev => ({ ...prev, totalItems: 0 }));
        
        if (response.status === 403) {
          alert('No tienes permisos para ver esta información');
        }
      }
    } catch (error) {
      console.error('💥 Error:', error);
      setUsers([]);
      setPagination(prev => ({ ...prev, totalItems: 0 }));
    } finally {
      setLoading(false);
    }
  };

  // Fetch inicial
  useEffect(() => {
    fetchUsers();
  }, []);

  // Refetch cuando cambian los filtros o ordenamiento
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1); // Volver a la primera página cuando cambian filtros
    }, 300); // Debounce de 300ms para el search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterRole, sortBy, sortOrder]);

  // Manejadores de paginación
  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, pagination.itemsPerPage);
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    fetchUsers(1, newLimit); // Volver a la primera página cuando cambia el límite
  };

  // Filter users (ya no se usa client-side, pero mantenemos para stats)
  // const totalUsers = users;

  // Handle save user
  const handleSaveUser = async (userData: Partial<User>) => {
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...userData,
          division: (userData as any).division || null,
          recalcEnrollments: (userData as any).recalcEnrollments
        })
      });

      if (response.ok) {
        // Refrescar la lista de usuarios manteniendo la página actual
        await fetchUsers(pagination.currentPage, pagination.itemsPerPage);
        
        setIsModalOpen(false);
        setEditingUser(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error al guardar usuario');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        // Refrescar la lista manteniendo la página actual si es posible
        let targetPage = pagination.currentPage;
        
        // Si esta es la última página y solo tiene 1 elemento, ir a la página anterior
        if (users.length === 1 && pagination.currentPage > 1) {
          targetPage = pagination.currentPage - 1;
        }
        
        await fetchUsers(targetPage, pagination.itemsPerPage);
      } else {
        const error = await response.json();
        alert(`Error al eliminar usuario: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  // Función para exportar usuarios a Excel
  const handleExportUsers = async (includeSubjects = false) => {
    try {
      setIsExporting(true);
      
      const params = new URLSearchParams();
      if (includeSubjects) {
        params.append('includeSubjects', 'true');
      }
      
      const response = await fetch(`/api/users/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Error al exportar usuarios');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios_${includeSubjects ? 'con_materias_' : ''}${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Error al exportar usuarios');
    } finally {
      setIsExporting(false);
    }
  };

  // Función para importar usuarios desde CSV
  const handleImportUsers = async () => {
    if (!importFile) {
      alert('Por favor selecciona un archivo CSV');
      return;
    }
    
    try {
      setIsImporting(true);
      setImportResults(null);
      
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await fetch('/api/users/import', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setImportResults(result);
        setImportFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        
        // Refrescar la lista de usuarios
        await fetchUsers(1, pagination.itemsPerPage);
        
        alert(`Importación completada. ${result.data.created} usuarios creados, ${result.data.updated} actualizados, ${result.data.errors} errores.`);
      } else {
        throw new Error(result.error || 'Error al importar usuarios');
      }
      
    } catch (error) {
      console.error('Error importing users:', error);
      alert('Error al importar usuarios');
    } finally {
      setIsImporting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: { background: '#881337', color: 'white' },
      teacher: { background: '#f59e0b', color: 'white' },
      student: { background: '#10b981', color: 'white' }
    };
    const labels = {
      admin: 'Administrador',
      teacher: 'Profesor',
      student: 'Estudiante'
    };
    return { style: colors[role as keyof typeof colors], label: labels[role as keyof typeof labels] };
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ color: '#6b7280' }}>Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de resultados de importación */}
      {importResults && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setImportResults(null);
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              width: '100%',
              maxWidth: '32rem',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                Resultados de Importación
              </h2>
              <button 
                onClick={() => setImportResults(null)}
                style={{
                  padding: '0.5rem',
                  backgroundColor: '#f3f4f6',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FiX size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(3, 1fr)', 
                gap: '1rem', 
                marginBottom: '1rem' 
              }}>
                <div style={{ 
                  background: '#ecfdf5', 
                  borderRadius: '0.5rem', 
                  padding: '1rem', 
                  textAlign: 'center',
                  border: '1px solid #10b981'
                }}>
                  <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    {importResults.data.created}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Creados</div>
                </div>
                
                <div style={{ 
                  background: '#fef3c7', 
                  borderRadius: '0.5rem', 
                  padding: '1rem', 
                  textAlign: 'center',
                  border: '1px solid #f59e0b'
                }}>
                  <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    {importResults.data.updated}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Actualizados</div>
                </div>
                
                <div style={{ 
                  background: '#fef2f2', 
                  borderRadius: '0.5rem', 
                  padding: '1rem', 
                  textAlign: 'center',
                  border: '1px solid #ef4444'
                }}>
                  <div style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '1.5rem' }}>
                    {importResults.data.errors}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Errores</div>
                </div>
              </div>

              {importResults.data.errorDetails && importResults.data.errorDetails.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
                    Detalles de errores:
                  </h3>
                  <div style={{ 
                    maxHeight: '12rem', 
                    overflow: 'auto', 
                    background: '#f9fafb', 
                    borderRadius: '0.5rem', 
                    padding: '0.75rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    {importResults.data.errorDetails.map((error: any, index: number) => (
                      <div key={index} style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: '500', color: '#ef4444' }}>Fila {error.row}:</span>
                        <span style={{ color: '#6b7280', marginLeft: '0.5rem' }}>{error.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setImportResults(null)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'linear-gradient(to right, #f59e0b, #881337)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-500 text-sm mt-1">Administra profesores, estudiantes y administradores del campus</p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Agregar Usuario
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Usuarios</p>
                <h3 className="text-2xl font-bold text-gray-900">{pagination.totalItems}</h3>
              </div>
              <div className="p-3 rounded-lg bg-indigo-50">
                <FiUsers className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Estudiantes</p>
                <h3 className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'student').length}</h3>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Profesores</p>
                <h3 className="text-2xl font-bold text-emerald-600">{users.filter(u => u.role === 'teacher').length}</h3>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50">
                <FiUsers className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Administradores</p>
                <h3 className="text-2xl font-bold text-amber-600">{users.filter(u => u.role === 'admin').length}</h3>
              </div>
              <div className="p-3 rounded-lg bg-amber-50">
                <FiUsers className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
          <div className="flex flex-1 gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="all">Todos los roles</option>
              <option value="student">Estudiantes</option>
              <option value="teacher">Profesores</option>
              <option value="admin">Administradores</option>
            </select>
          </div>

          <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
            <button
              onClick={() => handleExportUsers(false)}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <FiDownload size={16} />
              {isExporting ? 'Exportando...' : 'Exportar Excel'}
            </button>

            <button
              onClick={() => handleExportUsers(true)}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <FiFileText size={16} />
              {isExporting ? 'Exportando...' : 'Excel + Materias'}
            </button>

            {/* Botón de Importación */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors whitespace-nowrap"
              >
                <FiUpload size={16} />
                {importFile ? importFile.name.substring(0, 15) + '...' : 'Seleccionar CSV'}
              </button>
            </div>

            {importFile && (
              <button
                onClick={handleImportUsers}
                disabled={isImporting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <FiUpload size={16} />
                {isImporting ? 'Importando...' : 'Importar CSV'}
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Año</th>
                  <th className="px-6 py-4">División</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => {
                  const roleBadge = getRoleBadge(user.role);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-gray-500 text-xs">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'teacher' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.year ? `${user.year}°` : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {user.role === 'student' ? (user.division || '-') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                          <span className="text-gray-600">{user.is_active ? 'Activo' : 'Inactivo'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                          >
                            <FiEdit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && (
            <div className="text-center py-12">
              <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
              <p className="text-gray-500">Intenta ajustar los filtros de búsqueda o agrega un nuevo usuario.</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Cargando usuarios...</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {!loading && pagination.totalItems > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            isLoading={loading}
          />
        )}

        {/* Modal */}
        <EditUserModal
          user={editingUser}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
        />
      </div>
    </div>
    </>
  );
}

// Componente principal con protección de admin
export default function UsersPage() {
  return (
    <AdminProtected>
      <UsersPageContent />
    </AdminProtected>
  );
}
