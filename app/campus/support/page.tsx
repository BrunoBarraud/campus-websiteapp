'use client';

// Forzar rendering dinámico para evitar errores de SSR
export const dynamic = 'force-dynamic';

import React from 'react';

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 sm:py-8">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Soporte</h1>
          <p className="text-slate-600 mt-2">
            Si necesitás ayuda con el Campus Virtual, podés comunicarte con el equipo de soporte.
          </p>

          <div className="mt-6 space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-sm font-semibold text-slate-900">Recomendado</p>
              <p className="text-sm text-slate-600 mt-1">
                Enviá un email con tu nombre, curso y una captura del problema.
              </p>
              <a
                className="inline-block mt-3 text-sm font-semibold text-yellow-700 hover:text-yellow-800"
                href="mailto:soporte@ipdvs.edu.ar"
              >
                soporte@ipdvs.edu.ar
              </a>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200">
              <p className="text-sm font-semibold text-slate-900">Tip</p>
              <p className="text-sm text-slate-600 mt-1">
                Si no podés acceder, probá cerrar sesión y volver a iniciar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
