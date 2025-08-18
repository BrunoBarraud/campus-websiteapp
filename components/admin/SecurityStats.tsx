'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, UserCheck, Lock } from 'lucide-react';

interface SecurityStatsProps {
  className?: string;
}

interface StatsData {
  totalLoginAttempts: number;
  failedLoginAttempts: number;
  activeUsers: number;
  securityIncidents: number;
  loading: boolean;
  error: string | null;
}

/**
 * Componente que muestra estadísticas de seguridad para el panel de administración
 */
export default function SecurityStats({ className = '' }: SecurityStatsProps) {
  const [stats, setStats] = useState<StatsData>({
    totalLoginAttempts: 0,
    failedLoginAttempts: 0,
    activeUsers: 0,
    securityIncidents: 0,
    loading: true,
    error: null
  });

  useEffect(() => {
    fetchSecurityStats();
  }, []);

  const fetchSecurityStats = async () => {
    try {
      const response = await fetch('/api/admin/security/stats');
      
      if (!response.ok) {
        throw new Error('Error al cargar estadísticas de seguridad');
      }
      
      const data = await response.json();
      setStats({
        totalLoginAttempts: data.totalLoginAttempts || 0,
        failedLoginAttempts: data.failedLoginAttempts || 0,
        activeUsers: data.activeUsers || 0,
        securityIncidents: data.securityIncidents || 0,
        loading: false,
        error: null
      });
    } catch (err) {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Error desconocido'
      }));
      console.error('Error al cargar estadísticas de seguridad:', err);
    }
  };

  if (stats.loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <p className="text-center text-gray-500">Cargando estadísticas...</p>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center text-red-500 mb-2">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <h3 className="font-medium">Error</h3>
        </div>
        <p className="text-sm text-gray-600">{stats.error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h2 className="text-lg font-medium mb-4 flex items-center">
        <Shield className="h-5 w-5 text-blue-600 mr-2" />
        Estadísticas de Seguridad
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Usuarios Activos</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Lock className="h-8 w-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Inicios de Sesión</p>
              <p className="text-2xl font-bold">{stats.totalLoginAttempts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Intentos Fallidos</p>
              <p className="text-2xl font-bold">{stats.failedLoginAttempts}</p>
              <p className="text-xs text-gray-500">
                {stats.totalLoginAttempts > 0 
                  ? `${Math.round((stats.failedLoginAttempts / stats.totalLoginAttempts) * 100)}% del total`
                  : '0% del total'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Incidentes de Seguridad</p>
              <p className="text-2xl font-bold">{stats.securityIncidents}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}