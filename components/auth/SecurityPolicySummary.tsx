'use client';

import { useState } from 'react';
import { Shield, Lock, Eye, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityPolicyProps {
  showDetails?: boolean;
}

/**
 * Componente que muestra un resumen de las políticas de seguridad implementadas
 */
export default function SecurityPolicySummary({ showDetails = false }: SecurityPolicyProps) {
  const [expanded, setExpanded] = useState(showDetails);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between cursor-pointer" onClick={toggleExpanded}>
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium">Políticas de Seguridad</h3>
        </div>
        <button 
          className="text-gray-500 hover:text-gray-700"
          aria-expanded={expanded}
          aria-label={expanded ? 'Colapsar detalles' : 'Expandir detalles'}
        >
          {expanded ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>
      </div>
      
      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="flex items-start">
            <Lock className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Gestión de Contraseñas</h4>
              <p className="text-sm text-gray-600 mt-1">
                Implementamos políticas de contraseñas seguras, almacenamiento cifrado, y protección contra reutilización de contraseñas.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Protección contra Ataques</h4>
              <p className="text-sm text-gray-600 mt-1">
                Protección contra ataques de fuerza bruta, inyección SQL, y vulnerabilidades XSS. Bloqueo temporal de cuentas después de múltiples intentos fallidos.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Eye className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Monitoreo y Notificaciones</h4>
              <p className="text-sm text-gray-600 mt-1">
                Registro de actividad de usuario, notificaciones de seguridad para inicios de sesión sospechosos y cambios en la cuenta.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="font-medium">Cumplimiento y Mejores Prácticas</h4>
              <p className="text-sm text-gray-600 mt-1">
                Seguimos las mejores prácticas de seguridad OWASP, implementamos HTTPS, y mantenemos actualizaciones regulares de seguridad.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}