'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FiSearch, FiUser, FiMessageCircle, FiFilter, FiUsers, FiClock } from 'react-icons/fi';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: 'admin' | 'teacher' | 'student';
  online?: boolean;
  last_seen?: string;
}

interface SearchResponse {
  users: User[];
  query: string;
  total: number;
}

const UsersPage: React.FC = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Debounced search function
  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&limit=50`);
      const data: SearchResponse = await response.json();
      
      if (response.ok) {
        let filteredUsers = data.users || [];
        
        // Apply role filter
        if (selectedRole !== 'all') {
          filteredUsers = filteredUsers.filter(user => user.role === selectedRole);
        }
        
        setUsers(filteredUsers);
      } else {
        console.error('Error searching users:', data);
        setUsers([]);
        toast.error('Error al buscar usuarios');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setUsers([]);
      toast.error('Error al buscar usuarios');
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchUsers]);

  // Handle role filter change
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      searchUsers(searchTerm);
    }
  }, [selectedRole, searchTerm, searchUsers]);

  const handleSendMessage = async (userId: string) => {
    try {
      // Navigate to messaging page with the selected user
      router.push(`/campus/mensajeria?userId=${userId}`);
    } catch (error) {
      console.error('Error navigating to messages:', error);
      toast.error('Error al abrir conversación');
    }
  };

  const handleViewProfile = (_userId: string) => {
    // For now, we'll show a toast. In the future, this could open a modal or navigate to a profile page
    toast.success('Funcionalidad de ver perfil completo próximamente');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'teacher': return 'Profesor';
      case 'student': return 'Estudiante';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'teacher': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatLastSeen = (lastSeen: string) => {
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)} h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)} días`;
  };

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso requerido</h2>
          <p className="text-gray-600">Debes iniciar sesión para buscar usuarios.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Buscar Usuarios</h1>
          <p className="text-gray-600">Encuentra y conecta con otros miembros del campus</p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiFilter size={20} />
              <span>Filtros</span>
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                <label className="text-sm font-medium text-gray-700 mr-4">Filtrar por rol:</label>
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'student', label: 'Estudiantes' },
                  { value: 'teacher', label: 'Profesores' },
                  { value: 'admin', label: 'Administradores' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedRole(option.value)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedRole === option.value
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Results Header */}
          {searchTerm.trim().length >= 2 && (
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiUsers className="text-gray-500" size={20} />
                  <span className="text-sm text-gray-600">
                    {loading ? 'Buscando...' : `${users.length} usuario${users.length !== 1 ? 's' : ''} encontrado${users.length !== 1 ? 's' : ''}`}
                  </span>
                </div>
                {searchTerm && (
                  <span className="text-sm text-gray-500">
                    Búsqueda: &quot;{searchTerm}&quot;
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Buscando usuarios...</p>
              </div>
            ) : searchTerm.trim().length < 2 ? (
              <div className="p-8 text-center text-gray-500">
                <FiSearch size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Buscar usuarios</h3>
                <p>Ingresa al menos 2 caracteres para comenzar la búsqueda</p>
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FiUsers size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No se encontraron usuarios</h3>
                <p>Intenta con otros términos de búsqueda o ajusta los filtros</p>
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Avatar */}
                      <div className="relative">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-sm">
                              {getInitials(user.name)}
                            </span>
                          </div>
                        )}
                        {/* Online indicator */}
                        {user.online && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{user.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                        {user.last_seen && !user.online && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <FiClock size={12} />
                            <span>{formatLastSeen(user.last_seen)}</span>
                          </div>
                        )}
                        {user.online && (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>En línea</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewProfile(user.id)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver perfil"
                      >
                        <FiUser size={18} />
                      </button>
                      <button
                        onClick={() => handleSendMessage(user.id)}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        title="Enviar mensaje"
                      >
                        <FiMessageCircle size={16} />
                        <span className="hidden sm:inline">Mensaje</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Info */}
        {users.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Mostrando {users.length} de {users.length} usuarios encontrados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;