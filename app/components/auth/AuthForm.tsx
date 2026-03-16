'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useSchool } from '@/app/lib/contexts/ThemeProvider';
import { FloatingShapes } from '@/components/auth/FloatingShapes';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const { school } = useSchool();
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (school) {
      setLogoSrc(school.logoUrl || null);
    }
  }, [school]);

  if (!school) return null;

  const toggleMode = () => {
    router.push(mode === 'login' ? '/campus/auth/register' : '/campus/auth/login');
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/campus/dashboard' });
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 md:p-8 overflow-hidden bg-white">
      {/* Fondo con gradiente dinámico MUY suave */}
      <div 
        className="absolute inset-0 opacity-[0.08]"
        style={{ 
          backgroundImage: `linear-gradient(to bottom right, var(--primary), var(--secondary))` 
        }}
      />
      
      {/* Formas flotantes animadas */}
      <FloatingShapes />
      
      {/* Grid decorativo muy tenue */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, #000 1px, transparent 1px),
            linear-gradient(to bottom, #000 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Luces de ambiente dinámicas */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] pointer-events-none opacity-10" 
        style={{ backgroundColor: 'var(--primary)' }}
      />
      <div 
        className="absolute bottom-0 right-0 w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none opacity-[0.05]"
        style={{ backgroundColor: 'var(--secondary)' }}
      />

      {/* Card de Autenticación Principal */}
      <div className="w-full max-w-md relative animate-in fade-in-0 slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/60">
          <div className="p-8 md:p-10">
            {/* Logo */}
            <div className="flex justify-center mb-8 animate-in fade-in-0 zoom-in-95 duration-500 delay-100">
              <div className="relative group">
                <div 
                  className="absolute -inset-4 rounded-full blur-xl animate-pulse opacity-30 transition-opacity group-hover:opacity-50" 
                  style={{ backgroundColor: 'var(--primary)' }}
                />
                <div className="relative bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <Image
                    src={logoSrc || "/images/logo-velez.png"}
                    alt={`Logo ${school.name}`}
                    width={80}
                    height={80}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain transition-transform duration-500 group-hover:scale-110"
                    priority
                    onError={() => setLogoSrc("/images/logo-velez.png")}
                  />
                </div>
              </div>
            </div>

            {/* Título y Bienvenida */}
            <div className="text-center mb-10 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-200">
              <p className="text-slate-700 text-sm md:text-base font-semibold opacity-90">
                {mode === "login" 
                  ? "Bienvenido de nuevo. Accede al Campus." 
                  : "Únete hoy a nuestra comunidad educativa."
                }
              </p>
            </div>

            {/* Selector de Modo (Tabs estilo Glass) */}
            <div className="flex bg-slate-100 rounded-2xl p-1.5 mb-8 border border-slate-200/50">
              <button 
                onClick={() => mode === 'register' && toggleMode()}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'login' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                style={mode === 'login' ? { color: 'var(--primary)' } : {}}
              >
                Ingresar
              </button>
              <button 
                onClick={() => mode === 'login' && toggleMode()}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'register' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                style={mode === 'register' ? { color: 'var(--primary)' } : {}}
              >
                Registrarme
              </button>
            </div>

            {/* Botón de Autenticación de Google */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full relative group h-14 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden disabled:opacity-70"
            >
              <div 
                className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-[0.03]"
                style={{ backgroundColor: 'var(--primary)' }}
              />
              <svg className="w-5 h-5 relative" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="relative font-bold text-slate-800">
                {isLoading ? 'Conectando...' : mode === 'login' ? 'Continuar con Google' : 'Unirse con Google'}
              </span>
            </button>

            {/* Divider decorativo */}
            <div className="relative my-10">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                <span className="bg-white px-4 rounded-full">Acceso Seguro</span>
              </div>
            </div>

            {/* Footer de la Card */}
            <div className="flex flex-col items-center gap-4 text-slate-500 text-[11px] font-bold animate-in fade-in-0 duration-500 delay-500">
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-primary transition-colors hover:underline underline-offset-4">Soporte</a>
                <a href="#" className="hover:text-primary transition-colors hover:underline underline-offset-4">Términos</a>
                <a href="#" className="hover:text-primary transition-colors hover:underline underline-offset-4">Privacidad</a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Externo */}
        <footer className="mt-8 text-center animate-in fade-in-0 duration-1000 delay-700">
          <p className="text-xs font-bold text-slate-500 tracking-wide uppercase opacity-80">
            © {new Date().getFullYear()} • Campus Virtual
          </p>
        </footer>
      </div>
    </main>
  );
}
