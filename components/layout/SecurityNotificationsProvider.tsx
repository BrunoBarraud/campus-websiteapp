'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import SecurityNotifications from '../notifications/SecurityNotifications';

/**
 * Componente que proporciona notificaciones de seguridad en toda la aplicación
 * Se debe incluir en el layout principal para mostrar alertas importantes
 */
export default function SecurityNotificationsProvider() {
  const { data: session } = useSession();

  // Solo mostrar notificaciones si hay un usuario autenticado
  if (!session?.user) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <SecurityNotifications />
    </div>
  );
}