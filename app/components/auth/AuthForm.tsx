'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { yearHasDivisions, getAvailableDivisions, isValidDivisionForYear } from '@/app/lib/utils/divisions';
import TwoFactorPrompt from '@/components/auth/TwoFactorPrompt';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [division, setDivision] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  
  const router = useRouter();

  // Limpiar división cuando se selecciona 5° o 6° año
  const handleYearChange = (selectedYear: number | '') => {
    setYear(selectedYear);
    
    // Si es 5° o 6° año, limpiar la división ya que no la necesitan
    if (selectedYear && !yearHasDivisions(selectedYear)) {
      setDivision('');
    }
  };

  const toggleMode = () => {
    router.push(mode === 'login' ? '/campus/auth/register' : '/campus/auth/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Si ya estamos en modo de verificación 2FA, no reiniciar el proceso
    if (requiresTwoFactor && mode === 'login' && !twoFactorCode) {
      setIsLoading(false);
      return;
    }

    try {
      if (mode === 'register') {
        // Validar que la división sea correcta para el año seleccionado
        if (year && !isValidDivisionForYear(year, division)) {
          if (yearHasDivisions(year)) {
            throw new Error('Para años de 1° a 4°, debes seleccionar una división (A o B)');
          } else {
            // 5° y 6° año no deberían tener división, pero si la hay, la limpiamos
            setDivision('');
          }
        }

        // Registro usando la API de NextAuth que maneja Supabase
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email, 
            password, 
            name, 
            year: year || null,
            division: (year && yearHasDivisions(year)) ? division : null
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          
          // Manejar errores específicos del servidor
          if (response.status === 503) {
            throw new Error(data.details || 'El servicio está temporalmente no disponible. Por favor, intenta nuevamente en unos minutos.');
          }
          
          throw new Error(data.error || 'Error en el registro');
        }

        const registrationData = await response.json();
        
        // Si el registro fue exitoso pero necesita verificación de email
        if (registrationData.needsVerification) {
          setError(''); // Limpiar errores
          setIsLoading(false);
          
          // Mostrar mensaje de éxito y verificación
          alert(`✅ Registro exitoso!\n\n📧 Hemos enviado un email de verificación a: ${email}\n\nPor favor, revisa tu bandeja de entrada (y spam) y haz clic en el enlace para verificar tu cuenta.\n\nDespués de verificar tu email, podrás iniciar sesión.`);
          
          // Redirigir al login
          router.push('/campus/auth/login');
          return;
        }

        // Si no necesita verificación, continuar con login automático
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          // Si el error es por email no confirmado, mostrar mensaje específico
          if (result.error.includes('Email not confirmed') || result.error.includes('email_not_confirmed')) {
            setError('Registro exitoso. Por favor, revisa tu email para confirmar tu cuenta antes de iniciar sesión.');
          } else {
            setError('Registro exitoso, pero hubo un error al iniciar sesión automáticamente. Puedes intentar hacer login manualmente.');
          }
          // No redirigir si hay error de login
          return;
        }
      } else {
        // Login usando NextAuth
        const result = await signIn('credentials', {
          email,
          password,
          twoFactorCode,
          redirect: false,
        });

        if (result?.error) {
          // Verificar si el error es porque se requiere 2FA
          if (result.error.includes('two_factor_required')) {
            setRequiresTwoFactor(true);
            setError('');
            return;
          }
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

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 backdrop-blur-sm bg-white/80 p-4 sm:p-6 lg:p-8 rounded-xl shadow-md">
            {/* Campo Nombre (solo para registro) */}
            {mode === 'register' && (
              <>
                <div className="floating-input relative group">
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder=" "
                    required
                    className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all text-sm sm:text-base"
                  />
                  <label
                    htmlFor="name"
                    className="absolute left-2 sm:left-3 top-2 sm:top-3 text-gray-400 peer-focus:text-yellow-500 peer-focus:-translate-y-6 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 text-sm sm:text-base"
                  >
                    Nombre completo
                  </label>
                </div>

                {/* Campo Año (solo para registro) */}
                <div className="relative">
                  <select
                    id="year"
                    value={year}
                    onChange={(e) => handleYearChange(e.target.value ? parseInt(e.target.value) : '')}
                    className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none transition-all appearance-none bg-white text-sm sm:text-base"
                  >
                    <option value="">Selecciona tu año de estudio</option>
                    <option value="1">1er Año</option>
                    <option value="2">2do Año</option>
                    <option value="3">3er Año</option>
                    <option value="4">4to Año</option>
                    <option value="5">5to Año</option>
                    <option value="6">6to Año</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Campo División (solo para registro y años 1°-4°) */}
                {year && yearHasDivisions(year) && (
                  <div className="relative">
                    <select
                      id="division"
                      value={division}
                      onChange={(e) => setDivision(e.target.value)}
                      className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none transition-all appearance-none bg-white text-sm sm:text-base"
                      required
                    >
                      <option value="">Selecciona tu división</option>
                      {getAvailableDivisions(year).map((div) => (
                        <option key={div} value={div}>División {div}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Mensaje informativo para 5° y 6° año */}
                {year && !yearHasDivisions(year) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-blue-800 text-sm">
                      ℹ️ Los estudiantes de {year}° año no requieren selección de división.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Campo Email */}
            <div className="floating-input relative group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                required
                className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all text-sm sm:text-base"
              />
              <label
                htmlFor="email"
                className="absolute left-2 sm:left-3 top-2 sm:top-3 text-gray-400 peer-focus:text-yellow-500 peer-focus:-translate-y-6 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 text-sm sm:text-base"
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
                className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all text-sm sm:text-base"
              />
              <label
                htmlFor="password"
                className="absolute left-2 sm:left-3 top-2 sm:top-3 text-gray-400 peer-focus:text-yellow-500 peer-focus:-translate-y-6 peer-focus:scale-90 peer-focus:bg-white peer-focus:px-2 transition-all peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 text-sm sm:text-base"
              >
                Contraseña
              </label>
            </div>

            {/* Mostrar el componente TwoFactorPrompt si se requiere 2FA */}
            {requiresTwoFactor && mode === 'login' && (
              <div className="my-4">
                <TwoFactorPrompt 
                  onVerify={async (code) => {
                    setTwoFactorCode(code);
                    setIsLoading(true);
                    
                    try {
                      // Iniciar sesión directamente con el código 2FA
                      const result = await signIn('credentials', {
                        email,
                        password,
                        twoFactorCode: code,
                        redirect: false,
                      });
                      
                      if (result?.error) {
                        setError('Código de verificación incorrecto. Inténtalo de nuevo.');
                      } else {
                        router.push('/campus/dashboard');
                      }
                    } catch {
                      setError('Error al verificar el código. Inténtalo de nuevo.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  onCancel={() => {
                    setRequiresTwoFactor(false);
                    setTwoFactorCode('');
                  }}
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            )}

            {/* Mensaje de error */}
            {error && <p className="text-red-500 text-center text-xs sm:text-sm">{error}</p>}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 sm:py-3 md:py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold rounded-md shadow-md transition-transform transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-300 disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg"
            >
              {isLoading
                ? mode === 'login'
                  ? 'Accediendo...'
                  : 'Creando cuenta...'
                : requiresTwoFactor
                ? 'Verificar código'
                : mode === 'login'
                ? 'Acceder ahora'
                : 'Crear cuenta'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-4 sm:mt-6">
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/campus/dashboard' })}
                className="w-full py-2 sm:py-3 md:py-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-md shadow-sm transition-transform transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-yellow-300 text-sm sm:text-base md:text-lg flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.3 29.6 4 24 4 12.9 4 9.6 8.1 6.3 14.7z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.8 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.3 29.6 4 24 4 16.3 4 9.6 8.1 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2C29.3 36 27 36.8 24 36c-5.3 0-9.7-3.3-11.3-8H6.3C8.7 38 15.7 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.4 5.9-6.4 7.6l6.3 5.2C37.8 38.7 40 33.8 40 28c0-1.3-.1-2.7-.4-3.5z"/>
                </svg>
                Profesores: continuar con Google
              </button>
              <p className="mt-2 text-center text-xs text-gray-500">
                Alumnos: iniciá sesión con email y contraseña, o registrate.
              </p>
            </div>
          )}

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
