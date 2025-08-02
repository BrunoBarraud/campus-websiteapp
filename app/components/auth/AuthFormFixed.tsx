'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn } from 'next-auth/react';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export default function AuthFormFixed({ mode }: AuthFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    year: '' as number | '',
    division: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleMode = () => {
    router.push(mode === 'login' ? '/campus/auth/register' : '/campus/auth/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: formData.email, 
            password: formData.password, 
            name: formData.name, 
            year: formData.year || null,
            division: formData.division || null 
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Error en el registro');
        }

        const registrationData = await response.json();
        
        if (registrationData.needsVerification) {
          alert(`✅ Registro exitoso!\n\n📧 Hemos enviado un email de verificación a: ${formData.email}\n\nPor favor, revisa tu bandeja de entrada y haz clic en el enlace para verificar tu cuenta.`);
          router.push('/campus/auth/login');
          return;
        }

        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError('Registro exitoso, pero hubo un error al iniciar sesión automáticamente.');
          return;
        }
      } else {
        const result = await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error('Credenciales inválidas');
        }
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
    <div className="bg-gradient-to-br from-rose-950 to-amber-400 min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
        
        {/* Decoración superior */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-300 to-amber-400"></div>

        <div className="px-8 py-12 relative"> 
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/images/ipdvs-logo.png"
              alt="Logo IPDVS"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>

          {/* Título */}
          <h2 className="text-center mb-8">
            <span className="inline-block text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-rose-500">
              {mode === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </span>
            <span className="block mt-2 h-1 w-20 mx-auto bg-gradient-to-r from-amber-300 to-rose-400 rounded-full"></span>
          </h2>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-6 backdrop-blur-sm bg-white/80 p-6 rounded-xl shadow-md">
            
            {/* Campo Nombre (solo para registro) */}
            {mode === 'register' && (
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Nombre completo"
                  required
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-300 outline-none transition-all"
                />
              </div>
            )}

            {/* Campo Año (solo para registro) */}
            {mode === 'register' && (
              <div className="relative">
                <select
                  id="year"
                  value={formData.year}
                  onChange={(e) => {
                    const selectedYear = e.target.value ? parseInt(e.target.value) : '';
                    handleInputChange('year', selectedYear);
                    if (selectedYear === 5 || selectedYear === 6) {
                      handleInputChange('division', '');
                    }
                  }}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-300 outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Selecciona tu año de estudio</option>
                  <option value="1">1° Año</option>
                  <option value="2">2° Año</option>
                  <option value="3">3° Año</option>
                  <option value="4">4° Año</option>
                  <option value="5">5° Año</option>
                  <option value="6">6° Año</option>
                </select>
              </div>
            )}

            {/* Campo División (solo para registro y años 1-4) */}
            {mode === 'register' && formData.year && formData.year >= 1 && formData.year <= 4 && (
              <div className="relative">
                <select
                  id="division"
                  value={formData.division}
                  onChange={(e) => handleInputChange('division', e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-300 outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Selecciona tu división</option>
                  <option value="A">División A</option>
                  <option value="B">División B</option>
                  <option value="C">División C</option>
                </select>
              </div>
            )}

            {/* Campo Email */}
            <div className="relative">
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Correo electrónico"
                required
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-300 outline-none transition-all"
              />
            </div>

            {/* Campo Contraseña */}
            <div className="relative">
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Contraseña"
                required
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-300 outline-none transition-all"
              />
            </div>

            {/* Mensaje de error */}
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-md shadow-md transition-transform transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-70 disabled:cursor-not-allowed"
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
                  className="text-amber-500 hover:text-amber-600 font-medium"
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
                  className="text-amber-500 hover:text-amber-600 font-medium"
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
