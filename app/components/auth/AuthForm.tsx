'use client';
import { useState, useEffect } from 'react';
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
  const [userId, setUserId] = useState<string | null>(null);
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
            // Extraer el ID de usuario si está presente en el mensaje de error
            const userIdMatch = result.error.match(/user_id:([^,]+)/);
            if (userIdMatch && userIdMatch[1]) {
              setUserId(userIdMatch[1].trim());
            }
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
    <div className="bg-gradient-to-br from-rose-950 to-yellow-500 min-h-screen w-full flex items-center justify-center p-2 sm:p-4 lg:p-6">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 relative">
        
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
                className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all duration-300 ease-in-out text-sm sm:text-base hover:border-gray-400 focus:shadow-lg"
              />
              <label
                htmlFor="email"
                className={`absolute left-2 sm:left-3 text-gray-400 transition-all duration-300 ease-in-out pointer-events-none text-sm sm:text-base transform-gpu ${
                  email || document.activeElement?.id === 'email'
                    ? '-translate-y-6 scale-90 bg-white px-2 text-yellow-500 top-0 font-medium shadow-sm'
                    : 'top-3 sm:top-3 translate-y-0 scale-100 group-hover:text-gray-500'
                }`}
              >
                ✉️ Correo electrónico
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
                className="text-black w-full px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-md border border-gray-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 outline-none peer transition-all duration-300 ease-in-out text-sm sm:text-base hover:border-gray-400 focus:shadow-lg"
              />
              <label
                htmlFor="password"
                className={`absolute left-2 sm:left-3 text-gray-400 transition-all duration-300 ease-in-out pointer-events-none text-sm sm:text-base transform-gpu ${
                  password || document.activeElement?.id === 'password'
                    ? '-translate-y-6 scale-90 bg-white px-2 text-yellow-500 top-0 font-medium shadow-sm'
                    : 'top-2 sm:top-3 translate-y-0 scale-100 group-hover:text-gray-500'
                }`}
              >
                🔒 Contraseña
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
                    } catch (err) {
                      setError('Error al verificar el código. Inténtalo de nuevo.');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  onCancel={() => {
                    setRequiresTwoFactor(false);
                    setTwoFactorCode('');
                    setUserId(null);
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

            {/* Separador */}
            {mode === 'login' && (
              <div className="relative my-4 sm:my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs sm:text-sm">
                  <span className="bg-white px-2 text-gray-500">o continúa con</span>
                </div>
              </div>
            )}

            {/* Botón Google Sign-In (solo para login) */}
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/campus/dashboard' })}
                disabled={isLoading}
                className="w-full py-2 sm:py-3 md:py-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-md shadow-md transition-transform transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base md:text-lg flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Iniciar sesión con Google
              </button>
            )}
          </form>

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
