'use client';

import { useState } from 'react';
import Image from 'next/image';

interface TwoFactorPromptProps {
  onVerify: (code: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: string;
}

export default function TwoFactorPrompt({
  onVerify,
  onCancel,
  isLoading,
  error
}: TwoFactorPromptProps) {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onVerify(code);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <div className="flex justify-center mb-4">
        <div className="relative w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
          <Image 
            src="/images/shield-lock.svg" 
            alt="Autenticación de dos factores" 
            width={32} 
            height={32}
            className="text-yellow-600"
          />
        </div>
      </div>

      <h2 className="text-xl font-bold text-center mb-4">Verificación de dos factores</h2>
      
      <p className="text-gray-600 mb-6 text-center">
        Por favor, ingresa el código de verificación de tu aplicación de autenticación.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Código de verificación
          </label>
          <input
            type="text"
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ingresa el código de 6 dígitos"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
            required
            autoComplete="one-time-code"
            autoFocus
            pattern="[0-9]*"
            inputMode="numeric"
            maxLength={6}
          />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verificando...' : 'Verificar'}
          </button>
        </div>
      </form>

      <div className="mt-6 text-center text-xs text-gray-500">
        <p>Si has perdido acceso a tu aplicación de autenticación, contacta al administrador del sistema.</p>
      </div>
    </div>
  );
}