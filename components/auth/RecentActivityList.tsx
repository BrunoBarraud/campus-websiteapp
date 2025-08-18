'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Activity {
  id: string;
  action: string;
  details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

/**
 * Componente para mostrar la actividad reciente del usuario
 */
export default function RecentActivityList({ userId }: { userId: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/user/activity?limit=10`);
        
        if (!response.ok) {
          throw new Error('Error al cargar la actividad reciente');
        }
        
        const data = await response.json();
        setActivities(data.activities || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error al cargar actividad reciente:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [userId]);

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: es });
    } catch (e) {
      return dateString;
    }
  };

  // Función para obtener el icono según el tipo de actividad
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return '🔑';
      case 'LOGIN_FAILURE':
        return '🚫';
      case 'PASSWORD_CHANGED':
        return '🔒';
      case 'SECURITY_VIOLATION':
        return '⚠️';
      case 'ACCOUNT_LOCKED':
        return '🔐';
      case 'PROFILE_UPDATED':
        return '📝';
      default:
        return '📋';
    }
  };

  // Función para obtener el nombre legible de la acción
  const getActionName = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return 'Inicio de sesión exitoso';
      case 'LOGIN_FAILURE':
        return 'Intento de inicio de sesión fallido';
      case 'PASSWORD_CHANGED':
        return 'Cambio de contraseña';
      case 'SECURITY_VIOLATION':
        return 'Alerta de seguridad';
      case 'ACCOUNT_LOCKED':
        return 'Cuenta bloqueada temporalmente';
      case 'PROFILE_UPDATED':
        return 'Perfil actualizado';
      default:
        return action.replace(/_/g, ' ').toLowerCase();
    }
  };

  // Si está cargando, mostrar indicador
  if (loading) {
    return <p className="text-gray-500">Cargando actividad reciente...</p>;
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  // Si no hay actividades, mostrar mensaje
  if (activities.length === 0) {
    return <p className="text-gray-500">No hay actividad reciente para mostrar.</p>;
  }

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <li key={activity.id} className="py-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 text-xl">
                {getActivityIcon(activity.action)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {getActionName(activity.action)}
                </p>
                <div className="mt-1 text-sm text-gray-500">
                  <p>Dispositivo: {activity.user_agent}</p>
                  <p>Dirección IP: {activity.ip_address}</p>
                  <p>Fecha: {formatDate(activity.created_at)}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}