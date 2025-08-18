/**
 * Componente para incluir el token CSRF en formularios
 */

'use client';

import { useEffect, useState } from 'react';

interface CsrfTokenProps {
  // Opcional: función a ejecutar cuando el token CSRF esté disponible
  onTokenReady?: (token: string) => void;
}

/**
 * Componente que obtiene el token CSRF de las cookies y lo incluye en un campo oculto
 * para ser enviado con formularios.
 */
const CsrfToken: React.FC<CsrfTokenProps> = ({ onTokenReady }) => {
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    // Función para obtener el token CSRF de las cookies
    const getCsrfToken = (): string => {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('csrf_token=')) {
          return cookie.substring('csrf_token='.length, cookie.length);
        }
      }
      return '';
    };

    // Obtener el token CSRF
    const token = getCsrfToken();
    setCsrfToken(token);

    // Si se proporciona una función onTokenReady, llamarla con el token
    if (onTokenReady && token) {
      onTokenReady(token);
    }
  }, [onTokenReady]);

  return (
    <input type="hidden" name="csrf_token" value={csrfToken} />
  );
};

/**
 * Hook personalizado para obtener y usar el token CSRF en componentes
 */
export const useCsrfToken = () => {
  const [csrfToken, setCsrfToken] = useState<string>('');

  useEffect(() => {
    // Función para obtener el token CSRF de las cookies
    const getCsrfToken = (): string => {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith('csrf_token=')) {
          return cookie.substring('csrf_token='.length, cookie.length);
        }
      }
      return '';
    };

    // Obtener el token CSRF
    const token = getCsrfToken();
    setCsrfToken(token);
  }, []);

  // Función para incluir el token CSRF en headers de fetch
  const fetchWithCsrf = (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers || {});
    headers.append('x-csrf-token', csrfToken);

    return fetch(url, {
      ...options,
      headers,
    });
  };

  return { csrfToken, fetchWithCsrf };
};

export default CsrfToken;