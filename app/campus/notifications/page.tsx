import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/lib/auth-options';
import SecurityNotifications from '@/components/notifications/SecurityNotifications';

/**
 * Página para mostrar todas las notificaciones del usuario
 */
export default async function NotificationsPage() {
  // Verificar autenticación en el servidor
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/campus/auth/login');
  }
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notificaciones de seguridad</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <Suspense fallback={<p className="text-center py-4">Cargando notificaciones...</p>}>
          <SecurityNotifications />
        </Suspense>
      </div>
    </div>
  );
}