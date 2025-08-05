// 🛡️ Componente para proteger rutas de administrador
'use client';

import React from 'react';
import { useAdminAccess } from '@/app/lib/hooks/useAdminAccess';

interface AdminProtectedProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminProtected({ children, fallback }: AdminProtectedProps) {
  const { isLoading, hasAccess, userRole } = useAdminAccess();

  // Mostrar loading mientras verifica permisos
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-rose-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Verificando permisos...</h2>
          <p className="text-gray-500">Comprobando acceso de administrador</p>
        </div>
      </div>
    );
  }

  // Si no tiene acceso, mostrar mensaje de error o fallback
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-rose-50">
        <div className="max-w-md mx-auto text-center p-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m7-6V9a5 5 0 00-10 0v2M6 11h12a1 1 0 011 1v7a1 1 0 01-1 1H6a1 1 0 01-1-1v-7a1 1 0 011-1z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h1>
          
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a esta sección. Esta área está restringida solo para administradores.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-red-700">
                <strong>Tu rol actual:</strong> {userRole === 'teacher' ? 'Profesor' : userRole === 'student' ? 'Estudiante' : userRole || 'Sin definir'}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Volver Atrás
            </button>
            
            <button
              onClick={() => window.location.href = '/campus/dashboard'}
              className="w-full bg-gradient-to-r from-amber-400 to-rose-500 hover:from-amber-500 hover:to-rose-600 text-white font-medium py-2 px-4 rounded-lg transition-all transform hover:scale-105"
            >
              Ir al Dashboard
            </button>
          </div>
          
          <p className="text-xs text-gray-400 mt-6">
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>
        </div>
      </div>
    );
  }

  // Si tiene acceso, renderizar el contenido
  return <>{children}</>;
}
