'use client';

import { useEffect, useState } from 'react';
import { Wrench, Clock, ArrowLeft } from 'lucide-react';

interface MaintenanceInfo {
  enabled: boolean;
  message: string;
  estimated_end: string | null;
}

export default function MaintenancePage() {
  const [info, setInfo] = useState<MaintenanceInfo | null>(null);

  useEffect(() => {
    fetch('/api/admin/maintenance')
      .then(res => res.json())
      .then(data => setInfo(data))
      .catch(() => setInfo({ enabled: true, message: 'Estamos en mantenimiento.', estimated_end: null }));
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center">
        {/* Icono animado */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto bg-yellow-500/20 rounded-full flex items-center justify-center animate-pulse">
            <div className="w-24 h-24 bg-yellow-500/30 rounded-full flex items-center justify-center">
              <Wrench className="w-12 h-12 text-yellow-400 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-4xl font-bold text-white mb-4">
          En Mantenimiento
        </h1>

        {/* Mensaje */}
        <p className="text-xl text-slate-300 mb-6">
          {info?.message || 'Estamos realizando mejoras en el Campus Virtual.'}
        </p>

        <p className="text-slate-400 mb-8">
          Disculpá las molestias. Estamos trabajando para brindarte una mejor experiencia.
        </p>

        {/* Tiempo estimado */}
        {info?.estimated_end && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-8 inline-flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-400" />
            <span className="text-slate-300">
              Tiempo estimado de regreso: <span className="text-white font-semibold">{formatDate(info.estimated_end)}</span>
            </span>
          </div>
        )}

        {/* Logo del colegio */}
        <div className="mt-12 pt-8 border-t border-slate-700">
          <p className="text-slate-500 text-sm">
            Campus Virtual - Instituto Privado Dalmacio Vélez Sarsfield
          </p>
        </div>

        {/* Botón para reintentar */}
        <button
          onClick={() => window.location.href = '/campus/dashboard'}
          className="mt-6 inline-flex items-center gap-2 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Intentar acceder nuevamente
        </button>
      </div>
    </div>
  );
}
