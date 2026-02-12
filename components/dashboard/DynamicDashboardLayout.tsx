'use client';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Wrench, ArrowLeft } from 'lucide-react';

const DashboardLayout = dynamic(() => import('./DashboardLayout'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="bg-surface border border-border shadow-elevated rounded-xl p-4 sm:p-6 flex items-center gap-3">
        <svg
          className="animate-spin h-5 w-5 text-primary"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          ></path>
        </svg>
        <span className="text-gray-700 font-medium">Cargando el Campus…</span>
      </div>
    </div>
  ),
});

interface MaintenanceInfo {
  enabled: boolean;
  message: string;
  estimated_end: string | null;
}

export default function DynamicDashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [maintenance, setMaintenance] = useState<MaintenanceInfo | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Verificar modo mantenimiento
    fetch('/api/admin/maintenance')
      .then(res => res.json())
      .then(data => {
        setMaintenance(data);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, []);

  // Si está en mantenimiento y NO es admin, mostrar página de mantenimiento
  const isAdmin = session?.user?.role === 'admin';
  
  if (checked && maintenance?.enabled && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center animate-pulse">
              <div className="w-24 h-24 bg-yellow-500/30 rounded-full flex items-center justify-center">
                <Wrench className="w-12 h-12 text-yellow-400 animate-bounce" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            En Mantenimiento
          </h1>

          <p className="text-xl text-slate-300 mb-6">
            {maintenance.message || 'Estamos realizando mejoras en el Campus Virtual.'}
          </p>

          <p className="text-slate-400 mb-8">
            Disculpá las molestias. Estamos trabajando para brindarte una mejor experiencia.
          </p>

          <div className="mt-12 pt-8 border-t border-slate-700">
            <p className="text-slate-500 text-sm">
              Campus Virtual - Instituto Privado Dalmacio Vélez Sarsfield
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
