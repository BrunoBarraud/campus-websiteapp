"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from "react";
import {
  FiUsers,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiDownload,
  FiUpload,
  FiFileText,
} from 'react-icons/fi';
import AdminProtected from '@/components/auth/AdminProtected';
import Pagination from '@/components/ui/Pagination';
import { yearHasDivisions } from '@/app/lib/utils/divisions';

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

function AppModal({
  title,
  children,
  onClose,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_32px_80px_-36px_rgba(15,23,42,0.42)]`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">Los cambios se aplican sin alterar la lógica del módulo.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <FiX size={18} />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
      </div>
    </div>
  );
}

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
    <AppModal title={user ? 'Editar usuario' : 'Crear usuario'} onClose={onClose} maxWidth="max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nombre completo</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="app-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              className="app-input"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                role: e.target.value as 'admin' | 'teacher' | 'student',
                year: e.target.value === 'student' ? prev.year : undefined,
                division: e.target.value === 'student' ? prev.division : ''
              }))}
              className="app-select"
            >
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Año académico</label>
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
                className="app-select"
              >
                <option value="">Seleccionar año</option>
                {[1, 2, 3, 4, 5, 6].map(year => (
                  <option key={year} value={year}>{year}° Año</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {formData.role === 'student' && formData.year && yearHasDivisions(formData.year) && (
          <div className="space-y-2 md:max-w-xs">
            <label className="text-sm font-medium text-slate-700">División</label>
            <select
              value={formData.division}
              onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))}
              className="app-select"
            >
              <option value="">Seleccionar división</option>
              <option value="A">A</option>
              <option value="B">B</option>
            </select>
          </div>
        )}

        <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          {formData.role === 'student' && (
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={formData.recalcEnrollments}
                onChange={(e) => setFormData(prev => ({ ...prev, recalcEnrollments: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-yellow-600 focus:ring-yellow-300"
              />
              <span>
                <span className="font-medium text-slate-900">Recalcular materias del alumno</span>
                <span className="mt-1 block text-slate-500">Recomendado cuando cambiás año o división.</span>
              </span>
            </label>
          )}

          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-yellow-600 focus:ring-yellow-300"
            />
            <span>
              <span className="font-medium text-slate-900">Usuario activo</span>
              <span className="mt-1 block text-slate-500">Desactivalo si necesitás impedir el acceso sin borrar la cuenta.</span>
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="app-button-soft px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-2xl bg-yellow-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-yellow-700"
          >
            {user ? 'Actualizar' : 'Crear'}
          </button>
        </div>
      </form>
    </AppModal>
  );
}

function UsersPageContent() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [sortBy] = useState('name');
  const [sortOrder] = useState<'asc' | 'desc'>('asc');

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

  const fetchUsers = async (page: number = pagination.currentPage, limit: number = pagination.itemsPerPage) => {
    try {
      setLoading(true);
      const url = buildApiUrl(page, limit);
      console.log('Fetching users from:', url);

      const response = await fetch(url);
      if (response.ok) {
        const result: UsersResponse = await response.json();
        setUsers(result.data || []);
        setPagination(result.pagination);
      } else {
        console.error('Error fetching users:', response.status);
        setUsers([]);
        setPagination(prev => ({ ...prev, totalItems: 0 }));

        if (response.status === 403) {
          alert('No tienes permisos para ver esta información');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setUsers([]);
      setPagination(prev => ({ ...prev, totalItems: 0 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filterRole, sortBy, sortOrder]);

  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, pagination.itemsPerPage);
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    fetchUsers(1, newLimit);
  };

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

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        let targetPage = pagination.currentPage;

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

  const statCards = [
    {
      label: 'Total usuarios',
      value: pagination.totalItems,
      accent: 'bg-slate-100 text-slate-700',
    },
    {
      label: 'Estudiantes',
      value: users.filter(u => u.role === 'student').length,
      accent: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Profesores',
      value: users.filter(u => u.role === 'teacher').length,
      accent: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Administradores',
      value: users.filter(u => u.role === 'admin').length,
      accent: 'bg-amber-50 text-amber-600',
    },
  ];

  if (loading && users.length === 0) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-sm">
          Cargando usuarios...
        </div>
      </div>
    );
  }

  return (
    <>
      {importResults && (
        <AppModal title="Resultados de importación" onClose={() => setImportResults(null)} maxWidth="max-w-3xl">
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{importResults.data.created}</div>
                <div className="mt-1 text-sm text-emerald-700">Creados</div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{importResults.data.updated}</div>
                <div className="mt-1 text-sm text-amber-700">Actualizados</div>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{importResults.data.errors}</div>
                <div className="mt-1 text-sm text-red-700">Errores</div>
              </div>
            </div>

            {importResults.data.errorDetails && importResults.data.errorDetails.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Detalles de errores</h3>
                <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
                  {importResults.data.errorDetails.map((error: any, index: number) => (
                    <div key={index} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                      <span className="font-semibold text-red-600">Fila {error.row}:</span>
                      <span className="ml-2 text-slate-600">{error.error}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end border-t border-slate-200 pt-5">
              <button
                onClick={() => setImportResults(null)}
                className="rounded-2xl bg-yellow-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-yellow-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </AppModal>
      )}

      <div className="space-y-6">
        <section className="app-panel overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Administración</p>
                <h1 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">Gestión de usuarios</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Administra profesores, estudiantes y administradores del campus desde una vista más clara y consistente.
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-yellow-700"
              >
                <FiPlus className="h-4 w-4" />
                Agregar usuario
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4 sm:p-6">
            {statCards.map((card) => (
              <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.2)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{card.label}</p>
                    <h3 className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</h3>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.accent}`}>
                    <FiUsers className="h-5 w-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="app-panel p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex w-full flex-col gap-3 lg:flex-row">
              <div className="relative w-full lg:max-w-md">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="app-input pl-10"
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="app-select w-full lg:w-56"
              >
                <option value="all">Todos los roles</option>
                <option value="student">Estudiantes</option>
                <option value="teacher">Profesores</option>
                <option value="admin">Administradores</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExportUsers(false)}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <FiDownload size={16} />
                {isExporting ? 'Exportando...' : 'Exportar Excel'}
              </button>

              <button
                onClick={() => handleExportUsers(true)}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                <FiFileText size={16} />
                {isExporting ? 'Exportando...' : 'Excel + Materias'}
              </button>

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
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                >
                  <FiUpload size={16} />
                  {importFile ? importFile.name.substring(0, 18) + '...' : 'Seleccionar CSV'}
                </button>
              </div>

              {importFile && (
                <button
                  onClick={handleImportUsers}
                  disabled={isImporting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  <FiUpload size={16} />
                  {isImporting ? 'Importando...' : 'Importar CSV'}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="app-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="app-table min-w-[860px]">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Año</th>
                  <th>División</th>
                  <th>Estado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-600">
                          {user.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{user.name}</p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'teacher'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : user.role === 'teacher' ? 'Profesor' : 'Estudiante'}
                      </span>
                    </td>
                    <td className="text-slate-600">{user.year ? `${user.year}°` : '-'}</td>
                    <td className="text-slate-600">{user.role === 'student' ? (user.division || '-') : '-'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                        <span className="text-slate-600">{user.is_active ? 'Activo' : 'Inactivo'}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setIsModalOpen(true);
                          }}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white transition-colors hover:bg-amber-600"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white transition-colors hover:bg-red-600"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50">
                <FiUsers className="h-7 w-7 text-slate-300" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No se encontraron usuarios</h3>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Probá ajustando los filtros o creá un nuevo usuario desde el botón principal.
              </p>
            </div>
          )}

          {loading && users.length > 0 && (
            <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
              Cargando usuarios...
            </div>
          )}

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
        </section>

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
    </>
  );
}

export default function UsersPage() {
  return (
    <AdminProtected>
      <UsersPageContent />
    </AdminProtected>
  );
}
