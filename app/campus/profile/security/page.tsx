import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import RecentActivityList from '@/components/auth/RecentActivityList';
import ConnectedDevicesList from '@/components/auth/ConnectedDevicesList';
import SecurityPolicySummary from '@/components/auth/SecurityPolicySummary';
import TwoFactorAuth from '@/components/auth/TwoFactorAuth';

/**
 * Página de seguridad del perfil de usuario
 */
export default async function ProfileSecurityPage() {
  // Verificar autenticación en el servidor
  const session = await auth();
  
  if (!session?.user) {
    redirect('/campus/auth/login');
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Seguridad de la cuenta</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Cambiar contraseña</h2>
        <Suspense fallback={<p>Cargando...</p>}>
          <ChangePasswordForm userId={session.user.id} />
        </Suspense>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Actividad reciente</h2>
        <Suspense fallback={<p>Cargando actividad reciente...</p>}>
          <RecentActivityList userId={session.user.id} />
        </Suspense>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Autenticación de dos factores</h2>
        <Suspense fallback={<p>Cargando...</p>}>
          <TwoFactorAuth userId={session.user.id} />
        </Suspense>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Dispositivos conectados</h2>
        <Suspense fallback={<p>Cargando dispositivos...</p>}>
          <ConnectedDevicesList userId={session.user.id} />
        </Suspense>
      </div>
      
      <SecurityPolicySummary />
    </div>
  );
}

// El componente ChangePasswordForm ahora se importa desde components/auth/ChangePasswordForm

// El componente RecentActivityList ahora se importa desde components/auth/RecentActivityList

// El componente ConnectedDevicesList ahora se importa desde components/auth/ConnectedDevicesList