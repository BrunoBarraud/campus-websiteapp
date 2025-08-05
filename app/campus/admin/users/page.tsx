// 👥 Página de Gestión de Usuarios - Panel de Administración
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import AdminProtected from '@/components/auth/AdminProtected';
import Pagination from '@/components/ui/Pagination';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { FiUpload, FiDownload, FiUserPlus, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  year?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserFilters {
  role: string;
  search: string;
  year: string;
  is_active: string;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  
  // Filtros
  const [filters, setFilters] = useState<UserFilters>({
    role: 'all',
    search: '',
    year: 'all',
    is_active: 'all'
  });
  
  // Estados de UI
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Cargar usuarios
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...filters
      });

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setTotalItems(data.total || 0);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]);

  // Efecto para cargar usuarios
  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Datos paginados calculados
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return {
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      startItem,
      endItem
    };
  }, [currentPage, itemsPerPage, totalItems]);

  // Manejar cambio de filtros
  const handleFilterChange = (key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset a primera página
  };

  // Manejar selección de usuarios
  const handleUserSelection = (userId: string, selected: boolean) => {
    const newSelection = new Set(selectedUsers);
    if (selected) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUsers(newSelection);
  };

  // Seleccionar todos los usuarios visibles
  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  // Exportar usuarios
  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        includeSubjects: 'true'
      });

      const response = await fetch(`/api/users/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al exportar usuarios');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (err) {
      alert('Error al exportar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    }
  };

  // Importar usuarios
  const handleImport = async () => {
    if (!importFile) {
      alert('Selecciona un archivo CSV');
      return;
    }

    try {
      setImporting(true);
      
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('updateExisting', 'true');

      const response = await fetch('/api/users/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (response.ok) {
        alert(`Importación exitosa: ${result.result.successful} usuarios procesados`);
        setShowImportModal(false);
        setImportFile(null);
        fetchUsers();
      } else {
        alert('Error: ' + result.error);
      }
      
    } catch (err) {
      alert('Error al importar: ' + (err instanceof Error ? err.message : 'Error desconocido'));
    } finally {
      setImporting(false);
    }
  };

  // Formatear rol
  const formatRole = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'teacher': return 'Profesor';
      case 'student': return 'Estudiante';
      default: return role;
    }
  };

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
                  Gestión de Usuarios
                </h1>
                <p className="text-gray-600 mt-1">
                  Administra todos los usuarios del sistema campus
                </p>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <FiUpload size={16} />
                  Importar CSV
                </button>
                
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <FiDownload size={16} />
                  Exportar Excel
                </button>
                
                <button
                  onClick={() => {/* TODO: Implementar modal de nuevo usuario */}}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  <FiUserPlus size={16} />
                  Nuevo Usuario
                </button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiSearch className="inline mr-1" />
                  Búsqueda
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Buscar por nombre o email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>

              {/* Filtro por rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiFilter className="inline mr-1" />
                  Rol
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">Todos los roles</option>
                  <option value="admin">Administradores</option>
                  <option value="teacher">Profesores</option>
                  <option value="student">Estudiantes</option>
                </select>
              </div>

              {/* Filtro por año */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año Académico
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">Todos los años</option>
                  <option value="1">1° Año</option>
                  <option value="2">2° Año</option>
                  <option value="3">3° Año</option>
                  <option value="4">4° Año</option>
                  <option value="5">5° Año</option>
                  <option value="6">6° Año</option>
                </select>
              </div>

              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  value={filters.is_active}
                  onChange={(e) => handleFilterChange('is_active', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de usuarios */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200 overflow-hidden">
            {/* Header de tabla con acciones masivas */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Seleccionar todos ({selectedUsers.size} seleccionados)
                  </span>
                </label>
              </div>
              
              {selectedUsers.size > 0 && (
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm">
                    Eliminar seleccionados
                  </button>
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm">
                    Desactivar seleccionados
                  </button>
                </div>
              )}
            </div>

            {/* Contenido de la tabla */}
            {loading ? (
              <div className="p-8">
                <LoadingSpinner text="Cargando usuarios..." />
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchUsers}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500">No se encontraron usuarios con los filtros aplicados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seleccionar
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuario
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Año
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha Registro
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.has(user.id)}
                            onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'teacher' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {formatRole(user.role)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {user.year ? `${user.year}° Año` : '-'}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {new Date(user.created_at).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              title="Editar usuario"
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              title="Eliminar usuario"
                              className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginación */}
            {!loading && users.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={paginationData.totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                hasNextPage={paginationData.hasNextPage}
                hasPrevPage={paginationData.hasPrevPage}
                startItem={paginationData.startItem}
                endItem={paginationData.endItem}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
                isLoading={loading}
              />
            )}
          </div>
        </div>

        {/* Modal de Importación */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-bold mb-4">Importar Usuarios desde CSV</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Archivo CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Formato: nombre,email,rol,año,activo
                  </p>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Nota:</strong> Los usuarios existentes se actualizarán. 
                    Los nuevos usuarios tendrán la contraseña &quot;campus123&quot;.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportFile(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={importing}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {importing ? 'Importando...' : 'Importar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminProtected>
  );
};

export default AdminUsersPage;
