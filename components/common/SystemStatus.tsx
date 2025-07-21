import React, { useState, useEffect } from 'react';

interface SystemStatusProps {
  onRetry?: () => void;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ onRetry }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (onRetry) onRetry();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onRetry]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-lg max-w-sm z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Servicio temporalmente no disponible
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              La base de datos está experimentando problemas temporales. 
              Reintentando automáticamente en {countdown} segundos.
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onRetry && onRetry()}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded-md text-xs font-medium transition-colors"
            >
              Reintentar ahora
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="text-yellow-700 hover:text-yellow-800 px-3 py-1 text-xs font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
