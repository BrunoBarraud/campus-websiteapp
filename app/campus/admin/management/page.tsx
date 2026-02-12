'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Users,
  BookOpen,
  Calendar,
  UserPlus,
  Search,
  FileSpreadsheet,
  MoreHorizontal,
  Plus,
  School,
  GraduationCap,
  ShieldAlert,
} from 'lucide-react';

// --- COMPONENTES UI REUTILIZABLES ---

const Badge = ({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'purple' | 'blue';
}) => {
  const styles = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    purple: 'bg-purple-100 text-purple-700',
    blue: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-start justify-between">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
    <div className={`p-3 rounded-lg bg-opacity-10 ${colorClass.includes('bg-') ? colorClass : `bg-${colorClass.replace('text-', '')}`}`}>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
  </div>
);

const Button = ({
  children,
  variant = 'primary',
  icon: Icon,
  className = '',
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'success';
  icon?: React.ElementType;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) => {
  const base =
    'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {children}
    </button>
  );
};

// --- TIPOS ---
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  year?: number;
  division?: string;
  is_active: boolean;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  year: number;
  division?: string;
  teacher_id?: string;
  teacher?: { name: string };
}

// --- PANTALLA: GESTIÓN DE MATERIAS ---
const MateriasView = () => {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterDivision, setFilterDivision] = useState('all');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects');
      if (res.ok) {
        const data = await res.json();
        setSubjects(data || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(sub => {
    const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = filterYear === 'all' || sub.year.toString() === filterYear;
    const matchesDivision = filterDivision === 'all' || sub.division === filterDivision;
    return matchesSearch && matchesYear && matchesDivision;
  });

  const withTeacher = subjects.filter(s => s.teacher_id).length;
  const withoutTeacher = subjects.length - withTeacher;
  const uniqueYears = [...new Set(subjects.map(s => s.year))].length;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Materias</h1>
          <p className="text-gray-500 text-sm mt-1">
            Administra el plan de estudios y asignaciones docentes.
          </p>
        </div>
        <Button icon={Plus} onClick={() => router.push('/campus/settings/subjects')}>
          Nueva Materia
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Materias" value={subjects.length} icon={BookOpen} colorClass="text-blue-600" />
        <StatCard title="Con Profesor" value={withTeacher} icon={Users} colorClass="text-emerald-600" />
        <StatCard title="Años Activos" value={uniqueYears} icon={Calendar} colorClass="text-amber-600" />
        <StatCard title="Sin Asignar" value={withoutTeacher} icon={ShieldAlert} colorClass="text-purple-600" />
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por materia o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="all">Todos los años</option>
            {[1, 2, 3, 4, 5, 6].map(y => (
              <option key={y} value={y}>{y}° Año</option>
            ))}
          </select>
          <select 
            value={filterDivision}
            onChange={(e) => setFilterDivision(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-600 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="all">Todas las divisiones</option>
            <option value="A">División A</option>
            <option value="B">División B</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">Materia</th>
              <th className="px-6 py-4">Código</th>
              <th className="px-6 py-4">Año / Div</th>
              <th className="px-6 py-4">Profesor</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredSubjects.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600">
                    <BookOpen size={16} />
                  </div>
                  {sub.name}
                </td>
                <td className="px-6 py-4 text-gray-500 font-mono text-xs">{sub.code}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <Badge variant="blue">{sub.year}°</Badge>
                    {sub.division && <Badge variant="success">Div. {sub.division}</Badge>}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{sub.teacher?.name || 'Sin asignar'}</td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => router.push('/campus/settings/subjects')}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredSubjects.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron materias</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- PANTALLA: GESTIÓN DE USUARIOS ---
const UsuariosView = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users?limit=100');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const students = users.filter(u => u.role === 'student').length;
  const teachers = users.filter(u => u.role === 'teacher').length;
  const admins = users.filter(u => u.role === 'admin' || u.role === 'admin_director').length;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="purple">Admin</Badge>;
      case 'admin_director': return <Badge variant="purple">Director</Badge>;
      case 'teacher': return <Badge variant="blue">Profesor</Badge>;
      case 'student': return <Badge variant="default">Estudiante</Badge>;
      default: return <Badge>{role}</Badge>;
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-500 text-sm mt-1">
            Administra profesores, estudiantes y permisos.
          </p>
        </div>
        <Button icon={UserPlus} onClick={() => router.push('/campus/settings/users')}>
          Agregar Usuario
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Usuarios" value={users.length} icon={Users} colorClass="text-indigo-600" />
        <StatCard title="Estudiantes" value={students} icon={GraduationCap} colorClass="text-blue-600" />
        <StatCard title="Profesores" value={teachers} icon={School} colorClass="text-emerald-600" />
        <StatCard title="Administradores" value={admins} icon={ShieldAlert} colorClass="text-amber-600" />
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="flex flex-1 gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
            <option value="teacher">Profesor</option>
            <option value="student">Estudiante</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <Button variant="secondary" icon={FileSpreadsheet} onClick={() => router.push('/campus/settings/users')}>
            Gestión Completa
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 font-medium">
            <tr>
              <th className="px-6 py-4">Usuario</th>
              <th className="px-6 py-4">Rol</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.slice(0, 20).map((user) => (
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
                <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                    <span className="text-gray-600">{user.is_active ? 'Activo' : 'Inactivo'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => router.push('/campus/settings/users')}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron usuarios</p>
          </div>
        )}
        
        {filteredUsers.length > 20 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <button 
              onClick={() => router.push('/campus/settings/users')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Ver todos los {filteredUsers.length} usuarios →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- LAYOUT PRINCIPAL ---
export default function AdminManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [view, setView] = useState<'materias' | 'usuarios'>('usuarios');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'admin') {
      router.push('/campus/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Switcher */}
        <div className="bg-white p-1.5 rounded-lg inline-flex border border-gray-200 shadow-sm">
          <button
            onClick={() => setView('usuarios')}
            className={`px-4 py-2 text-sm rounded-md font-medium transition-all ${
              view === 'usuarios'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Usuarios
          </button>
          <button
            onClick={() => setView('materias')}
            className={`px-4 py-2 text-sm rounded-md font-medium transition-all ${
              view === 'materias'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-4 h-4 inline mr-2" />
            Materias
          </button>
        </div>

        {view === 'usuarios' ? <UsuariosView /> : <MateriasView />}
      </div>
    </div>
  );
}
