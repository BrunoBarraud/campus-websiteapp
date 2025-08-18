'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Bell } from 'lucide-react';

/**
 * Componente que muestra un indicador de notificaciones en la barra de navegación
 */
export default function NotificationBadge() {
  const { data: session } = useSession();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Cargar conteo de notificaciones al montar el componente
  useEffect(() => {
    if (session?.user) {
      fetchNotificationCount();
      
      // Actualizar cada 5 minutos
      const interval = setInterval(fetchNotificationCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Función para obtener conteo de notificaciones no leídas
  const fetchNotificationCount = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/count');
      
      if (!response.ok) {
        throw new Error('Error al cargar notificaciones');
      }
      
      const data = await response.json();
      setCount(data.count || 0);
    } catch (err) {
      console.error('Error al cargar conteo de notificaciones:', err);
    } finally {
      setLoading(false);
    }
  };

  // Si no hay sesión o está cargando, no mostrar nada
  if (!session?.user || loading) {
    return null;
  }

  return (
    <Link href="/campus/notifications" className="relative">
      <Bell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}