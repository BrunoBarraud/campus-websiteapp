/**
 * Página de administración de seguridad
 */

import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/lib/auth-options';
import SecurityDashboard from '@/components/admin/SecurityDashboard';

export const metadata = {
  title: 'Administración de Seguridad | Campus Virtual',
  description: 'Panel de administración de seguridad del Campus Virtual',
};

export default async function SecurityAdminPage() {
  // Verificar sesión y permisos
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/campus/auth/login');
  }
  
  if (session?.user?.role !== 'admin') {
    redirect('/campus/dashboard');
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Administración de Seguridad</h1>
      
      <Suspense fallback={<div>Cargando panel de seguridad...</div>}>
        <SecurityDashboard />
      </Suspense>
    </div>
  );
}