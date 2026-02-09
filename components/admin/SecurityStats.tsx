'use client';

import { useState, useEffect, useRef } from 'react';

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

  const fetchGuardRef = useRef(false);

  useEffect(() => {
    // Evitar dobles ejecuciones del efecto en desarrollo (React StrictMode)
    // usando una bandera que garantice que solo se cargue una vez
    const hasFetchedRef = fetchGuardRef.current;
    if (hasFetchedRef) return;
    fetchGuardRef.current = true;
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
      <div className={`bg-white rounded-xl shadow-soft border border-gray-100 p-6 ${className}`}>
        <p className="text-center text-gray-500 text-sm">Cargando estadísticas...</p>
      </div>
    );
  }

  if (stats.error) {
    return (
      <div className={`bg-white rounded-xl shadow-soft border border-red-100 p-6 ${className}`}>
        <div className="flex items-center text-red-600 mb-2">
          <AlertTriangle className="h-5 w-5 mr-2" />
          <h3 className="font-medium text-rose-950">Error</h3>
        </div>
        <p className="text-sm text-gray-600">{stats.error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-soft border border-gray-100 p-6 ${className}`}>
      <h2 className="text-lg font-semibold mb-4 flex items-center text-rose-950">
        <Shield className="h-5 w-5 text-[var(--primary)] mr-2" />
        Estadísticas de seguridad
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-rose-900 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Usuarios activos</p>
              <p className="text-2xl font-bold text-rose-950">{stats.activeUsers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="flex items-center">
            <Lock className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Inicios de sesión</p>
              <p className="text-2xl font-bold text-rose-950">{stats.totalLoginAttempts}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Intentos fallidos</p>
              <p className="text-2xl font-bold text-rose-950">{stats.failedLoginAttempts}</p>
              <p className="text-xs text-gray-500">
                {stats.totalLoginAttempts > 0 
                  ? `${Math.round((stats.failedLoginAttempts / stats.totalLoginAttempts) * 100)}% del total`
                  : '0% del total'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Incidentes de seguridad</p>
              <p className="text-2xl font-bold text-rose-950">{stats.securityIncidents}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}