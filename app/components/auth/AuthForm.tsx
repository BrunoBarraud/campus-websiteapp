'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn } from 'next-auth/react';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();

  const toggleMode = () => {
    router.push(mode === 'login' ? '/campus/auth/register' : '/campus/auth/login');
  };

  return (
    <div className="bg-gradient-to-br from-rose-950 to-yellow-500 min-h-screen w-full flex items-center justify-center p-2 sm:p-4 lg:p-6 dark:bg-gradient-to-br dark:from-rose-950 dark:to-yellow-500">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 relative dark:bg-white dark:border-gray-200">
        
        {/* Decoración superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 to-yellow-400"></div>

        <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-8 sm:py-10 lg:py-12"> 
          {/* Logo local */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <Image
              src="/images/ipdvs-logo.png"
              alt="Logo del Campus - IPDVS"
              width={60}
              height={60}
              className="sm:w-20 sm:h-20 p-2 object-contain"
            />
          </div>

          {/* Título */}
          <h2 className="text-center mb-6 sm:mb-8">
            <span className="inline-block text-2xl sm:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-rose-500">
              {mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </span>
            <span className="block mt-2 h-1 w-16 sm:w-20 mx-auto bg-gradient-to-r from-yellow-300 to-rose-400 rounded-full"></span>
          </h2>

          {/* Contenido del formulario */}
          <div className="space-y-4 sm:space-y-6 backdrop-blur-sm bg-white/80 p-4 sm:p-6 lg:p-8 rounded-xl shadow-md">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-900 text-sm">
                {mode === 'login' 
                  ? 'Iniciá sesión con tu cuenta de Google institucional o personal.'
                  : 'Por el momento, el registro es únicamente con Google.'}
              </p>
              {mode === 'register' && (
                <p className="text-yellow-900 text-sm mt-2">
                  Luego vas a poder completar tu <span className="font-semibold">año</span> y <span className="font-semibold">división</span> desde tu perfil.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => signIn('google', { callbackUrl: '/campus/dashboard' })}
              className="w-full py-2 sm:py-3 md:py-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-md shadow-sm transition-transform transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm sm:text-base md:text-lg flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.807 32.657 29.314 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.747 6.053 29.614 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.747 6.053 29.614 4 24 4c-7.682 0-14.41 4.337-17.694 10.691z"/>
                <path fill="#4CAF50" d="M24 44c5.18 0 9.957-1.986 13.549-5.219l-6.263-5.303C29.421 34.951 26.824 36 24 36c-5.292 0-9.773-3.317-11.303-7.946l-6.522 5.025C9.405 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.73 2.088-2.062 3.862-3.817 5.178l.003-.002 6.263 5.303C36.907 39.291 44 35 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              {mode === 'login' ? 'Iniciar sesión con Google' : 'Registrarse con Google'}
            </button>
          </div>

          {/* Cambiar modo */}
          <div className="text-center text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6">
            {mode === 'login' ? (
              <>
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-yellow-500 hover:text-yellow-600 font-medium"
                >
                  Regístrate
                </button>
              </>
            ) : (
              <>
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-yellow-500 hover:text-yellow-600 font-medium"
                >
                  Inicia sesión
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pie de formulario */}
        <div className="bg-gray-50 px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-center text-xs text-gray-500">
          © 2025 IPDVS. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
