"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabaseClient';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Obtener tokens de la URL
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || type !== 'email') {
          setStatus('error');
          setMessage('Link de verificación inválido');
          return;
        }

        // Verificar el email con Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email',
        });

        if (error) {
          console.error('Error verificando email:', error);
          setStatus('error');
          setMessage('Error al verificar el email. El link puede haber expirado.');
        } else {
          setStatus('success');
          setMessage('¡Email verificado exitosamente! Ahora puedes iniciar sesión.');
          
          // Redirigir al login después de 3 segundos
          setTimeout(() => {
            router.push('/campus/auth/login');
          }, 3000);
        }
      } catch (error) {
        console.error('Error inesperado:', error);
        setStatus('error');
        setMessage('Error inesperado al verificar el email.');
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="bg-gradient-to-br from-rose-950 to-yellow-500 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-rose-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">IPDVS</span>
          </div>
        </div>

        {/* Título */}
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Verificación de Email
        </h1>

        {/* Estado de verificación */}
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
            <p className="text-gray-600">Verificando tu email...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="text-green-500 text-5xl mb-4">✅</div>
            <p className="text-green-600 font-semibold">{message}</p>
            <p className="text-gray-500 text-sm">
              Serás redirigido al login en unos segundos...
            </p>
            <button
              onClick={() => router.push('/campus/auth/login')}
              className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              Ir al Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="text-red-500 text-5xl mb-4">❌</div>
            <p className="text-red-600 font-semibold">{message}</p>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/campus/auth/register')}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Registrarse de nuevo
              </button>
              <button
                onClick={() => router.push('/campus/auth/login')}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Ir al Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
