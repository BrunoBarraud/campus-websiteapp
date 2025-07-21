'use client'

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { User, Subject, UserRole, CreateUserForm, CreateSubjectForm } from '@/app/lib/types';

interface AdminDashboardProps {}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'subjects' | 'stats'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Formularios
  const [userForm, setUserForm] = useState<CreateUserForm>({
    name: '',
    email: '',
    password: '',
    role: 'student',
    year: 1,
    phone: '',
    bio: ''
  });

  const [subjectForm, setSubjectForm] = useState<CreateSubjectForm>({
    name: '',
    code: '',
    description: '',
    year: 1,
    semester: 1,
    credits: 0,
    teacher_id: ''
  });

  const [filters, setFilters] = useState({
    userRole: '' as UserRole | '',
    userYear: '',
    subjectYear: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUsers(),
        loadSubjects(),
        loadTeachers()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.userRole) params.append('role', filters.userRole);
      if (filters.userYear) params.append('year', filters.userYear);

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects');
      const data = await response.json();
      
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await fetch('/api/admin/users?role=teacher');
      const data = await response.json();
      
      if (data.success) {
        setTeachers(data.data);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Usuario creado exitosamente');
        setShowUserModal(false);
        resetUserForm();
        loadUsers();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error al crear usuario');
    }
  };

  const handleCreateSubject = async () => {
    try {
      const response = await fetch('/api/admin/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subjectForm)
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Materia creada exitosamente');
        setShowSubjectModal(false);
        resetSubjectForm();
        loadSubjects();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating subject:', error);
      alert('Error al crear materia');
    }
  };

  const handleAssignTeacher = async (subjectId: string, teacherId: string) => {
    try {
      const response = await fetch(`/api/admin/subjects/${subjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: teacherId })
      });

      const data = await response.json();
      
      if (data.success) {
        alert('Profesor asignado exitosamente');
        loadSubjects();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error assigning teacher:', error);
      alert('Error al asignar profesor');
    }
  };

  const resetUserForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'student',
      year: 1,
      phone: '',
      bio: ''
    });
    setEditingUser(null);
  };

  const resetSubjectForm = () => {
    setSubjectForm({
      name: '',
      code: '',
      description: '',
      year: 1,
      semester: 1,
      credits: 0,
      teacher_id: ''
    });
    setEditingSubject(null);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'teacher': return 'Profesor';
      case 'student': return 'Estudiante';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600 mt-2">Gestiona usuarios, materias y configuraciones del campus</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 Usuarios ({users.length})
              </button>
              <button
                onClick={() => setActiveTab('subjects')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subjects'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📚 Materias ({subjects.length})
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 Estadísticas
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* USUARIOS TAB */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-4">
                    <select
                      value={filters.userRole}
                      onChange={(e) => setFilters({...filters, userRole: e.target.value as UserRole | ''})}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Todos los roles</option>
                      <option value="admin">Administradores</option>
                      <option value="teacher">Profesores</option>
                      <option value="student">Estudiantes</option>
                    </select>
                    
                    <select
                      value={filters.userYear}
                      onChange={(e) => setFilters({...filters, userYear: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Todos los años</option>
                      {[1,2,3,4,5,6].map(year => (
                        <option key={year} value={year}>{year}° año</option>
                      ))}
                    </select>

                    <button
                      onClick={loadUsers}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      🔄 Filtrar
                    </button>
                  </div>

                  <button
                    onClick={() => setShowUserModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Crear Usuario
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Año
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                              {getRoleLabel(user.role)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.year ? `${user.year}° año` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">
                              Editar
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              Desactivar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MATERIAS TAB */}
            {activeTab === 'subjects' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex space-x-4">
                    <select
                      value={filters.subjectYear}
                      onChange={(e) => setFilters({...filters, subjectYear: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Todos los años</option>
                      {[1,2,3,4,5,6].map(year => (
                        <option key={year} value={year}>{year}° año</option>
                      ))}
                    </select>

                    <button
                      onClick={loadSubjects}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      🔄 Filtrar
                    </button>
                  </div>

                  <button
                    onClick={() => setShowSubjectModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Crear Materia
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {subjects.map((subject) => (
                    <div key={subject.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                          <p className="text-sm text-gray-500">Código: {subject.code}</p>
                          <p className="text-sm text-gray-500">{subject.year}° año • {subject.credits} créditos</p>
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {subject.semester}° sem
                        </span>
                      </div>

                      {subject.description && (
                        <p className="text-sm text-gray-600 mb-4">{subject.description}</p>
                      )}

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Profesor asignado:</p>
                            <p className="text-sm font-medium">
                              {subject.teacher?.name || 'Sin asignar'}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <select
                              onChange={(e) => e.target.value && handleAssignTeacher(subject.id, e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded"
                              defaultValue=""
                            >
                              <option value="">Asignar profesor</option>
                              {teachers.map(teacher => (
                                <option key={teacher.id} value={teacher.id}>
                                  {teacher.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ESTADÍSTICAS TAB */}
            {activeTab === 'stats' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <span className="text-2xl">👥</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                        <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <span className="text-2xl">🎓</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Estudiantes</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {users.filter(u => u.role === 'student').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <span className="text-2xl">👨‍🏫</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Profesores</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {users.filter(u => u.role === 'teacher').length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <span className="text-2xl">📚</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Materias</p>
                        <p className="text-2xl font-semibold text-gray-900">{subjects.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfico de distribución por año */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Distribución de Estudiantes por Año</h3>
                  <div className="space-y-3">
                    {[1,2,3,4,5,6].map(year => {
                      const count = users.filter(u => u.role === 'student' && u.year === year).length;
                      const percentage = users.filter(u => u.role === 'student').length > 0 
                        ? (count / users.filter(u => u.role === 'student').length) * 100 
                        : 0;
                      
                      return (
                        <div key={year} className="flex items-center">
                          <div className="w-20 text-sm font-medium text-gray-600">
                            {year}° año
                          </div>
                          <div className="flex-1 mx-4">
                            <div className="bg-gray-200 rounded-full h-4">
                              <div 
                                className="bg-blue-600 h-4 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="w-16 text-sm text-gray-600 text-right">
                            {count} estudiantes
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Crear Usuario */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateUser();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    required
                    value={userForm.password}
                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    required
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value as UserRole})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="student">Estudiante</option>
                    <option value="teacher">Profesor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                {userForm.role === 'student' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año *
                    </label>
                    <select
                      required
                      value={userForm.year}
                      onChange={(e) => setUserForm({...userForm, year: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[1,2,3,4,5,6].map(year => (
                        <option key={year} value={year}>{year}° año</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biografía
                  </label>
                  <textarea
                    value={userForm.bio}
                    onChange={(e) => setUserForm({...userForm, bio: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowUserModal(false);
                    resetUserForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear Materia */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingSubject ? 'Editar Materia' : 'Crear Nueva Materia'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateSubject();
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la materia *
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código *
                  </label>
                  <input
                    type="text"
                    required
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value.toUpperCase()})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ej: MAT1, FIS2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Año *
                    </label>
                    <select
                      required
                      value={subjectForm.year}
                      onChange={(e) => setSubjectForm({...subjectForm, year: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {[1,2,3,4,5,6].map(year => (
                        <option key={year} value={year}>{year}° año</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Semestre
                    </label>
                    <select
                      value={subjectForm.semester}
                      onChange={(e) => setSubjectForm({...subjectForm, semester: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1° semestre</option>
                      <option value={2}>2° semestre</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Créditos
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm({...subjectForm, credits: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profesor asignado
                  </label>
                  <select
                    value={subjectForm.teacher_id}
                    onChange={(e) => setSubjectForm({...subjectForm, teacher_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={subjectForm.description}
                    onChange={(e) => setSubjectForm({...subjectForm, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubjectModal(false);
                    resetSubjectForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSubject ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
