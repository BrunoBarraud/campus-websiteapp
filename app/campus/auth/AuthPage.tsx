'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const toggleMode = () => {
    router.push(mode === 'login' ? '/campus/auth/register' : '/campus/auth/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/campus/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error al procesar tu solicitud.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-rose-100 to-gray-100 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Decoración superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-300 to-yellow-400"></div>

        <div className="px-10 py-12">
          {/* Logo local */}
          <div className="flex justify-center mb-8">
            <Image
              src="/images/ipdvs-logo.png"
              alt="Logo del Campus - IPDVS"
              width={80}
              height={80}
              className="rounded-full bg-yellow-300 p-2 object-contain"
            />
          </div>

          {/* Título */}
          <h2 className="text-center mb-8">
            <span className="inline-block text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-rose-500">
              {mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </span>
            <span className="block mt-2 h-1 w-20 mx-auto bg-gradient-to-r from-yellow-300 to-rose-400 rounded-full"></span>
          </h2>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6 backdrop-blur-sm bg-white/80 p-8 rounded-xl shadow-md">
            {/* Campo Email */}
            <div className="floating-input relative group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                required
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all"
              />
              <label
                htmlFor="email"
                className="absolute left-3 top-3 text-gray-400 peer-focus:text-yellow-500 peer-focus:-translate-y-6 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100"
              >
                Correo electrónico
              </label>
            </div>

            {/* Campo Contraseña */}
            <div className="floating-input relative group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all"
              />
              <label
                htmlFor="password"
                className="absolute left-3 top-3 text-gray-400 peer-focus:text-yellow-500 peer-focus:-translate-y-6 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100"
              >
                Contraseña
              </label>
            </div>

            {/* Mensaje de error */}
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-md shadow-md transition-transform transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading
                ? mode === 'login'
                  ? 'Accediendo...'
                  : 'Creando cuenta...'
                : mode === 'login'
                ? 'Acceder ahora'
                : 'Crear cuenta'}
            </button>
          </form>

          {/* Cambiar modo */}
          <div className="text-center text-sm text-gray-500 mt-6">
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
        <div className="bg-gray-50 px-8 py-4 text-center text-xs text-gray-500">
          © 2025 IPDVS. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
