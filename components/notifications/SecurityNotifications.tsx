'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import SecurityAlert from '../ui/SecurityAlert';
import { SecurityNotificationType } from '@/app/lib/services/security-notifications';

interface Notification {
  id: string;
  type: SecurityNotificationType;
  title: string;
  message: string;
  details?: Record<string, any>;
  requires_action: boolean;
  action_url?: string;
  is_read: boolean;
  created_at: string;
}

/**
 * Componente para mostrar notificaciones de seguridad al usuario
 */
export default function SecurityNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session]);

  // Función para obtener notificaciones
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/security');
      
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }
      
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al cargar notificaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para marcar una notificación como leída
  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Error al marcar notificación como leída');
      }
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err);
    }
  };

  // Determinar el tipo de alerta según el tipo de notificación
  const getAlertType = (type: SecurityNotificationType) => {
    switch (type) {
      case SecurityNotificationType.ACCOUNT_LOCKED:
      case SecurityNotificationType.SECURITY_ALERT:
        return 'error';
      case SecurityNotificationType.SUSPICIOUS_LOGIN:
        return 'warning';
      case SecurityNotificationType.PASSWORD_CHANGED:
      case SecurityNotificationType.ADMIN_ACTION:
        return 'info';
      default:
        return 'info';
    }
  };

  // Si no hay sesión, no mostrar nada
  if (!session?.user) {
    return null;
  }

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Cargando notificaciones...</p>
      </div>
    );
  }

  // Si hay error, mostrar mensaje
  if (error) {
    return (
      <div className="p-4">
        <SecurityAlert 
          type="error" 
          title="Error" 
          message={error} 
          autoClose={false} 
        />
      </div>
    );
  }

  // Si no hay notificaciones, no mostrar nada
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-4">
      {notifications
        .filter(notif => !notif.is_read) // Solo mostrar no leídas
        .map(notification => (
          <SecurityAlert
            key={notification.id}
            type={getAlertType(notification.type as SecurityNotificationType)}
            title={notification.title}
            message={notification.message}
            autoClose={false}
            onClose={() => markAsRead(notification.id)}
            actionLink={notification.requires_action && notification.action_url ? notification.action_url : undefined}
            actionText={notification.requires_action ? "Ver detalles" : undefined}
          />
        ))}
    </div>
  );
}