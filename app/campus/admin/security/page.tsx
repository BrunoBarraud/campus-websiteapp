import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/lib/auth-options';
import SecurityDashboard from '@/components/admin/SecurityDashboard';

/**
 * Página de administración de seguridad
 */
export default async function AdminSecurityPage() {
  // Verificar autenticación y permisos
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/campus/login');
  }
  
  // Verificar que el usuario es administrador
  if (session.user.role !== 'admin') {
    redirect('/campus/dashboard');
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Panel de Administración de Seguridad</h1>
      
      <Suspense fallback={<div>Cargando panel de seguridad...</div>}>
        <SecurityDashboard />
      </Suspense>
    </div>
  );
}