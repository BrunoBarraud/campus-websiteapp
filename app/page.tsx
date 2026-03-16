'use client';
import React from "react";
import { useSchool } from "@/app/lib/contexts/ThemeProvider";
import { ArrowRight, GraduationCap, FileText, BarChart } from "lucide-react";

export default function Page() {
  const { school } = useSchool();

  if (!school) return null;

  // Colores con transparencia para efectos de fondo
  const primaryLight = `${school.primaryColor}15`;
  const primarySolid = school.primaryColor;
  const secondarySolid = school.secondaryColor;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-50/50 selection:bg-indigo-100">
      
      {/* Círculos de luz decorativos de fondo */}
      <div 
        className="absolute -top-24 -left-24 w-96 h-96 blur-[120px] rounded-full opacity-30 animate-pulse"
        style={{ backgroundColor: primarySolid }}
      />
      <div 
        className="absolute -bottom-24 -right-24 w-96 h-96 blur-[120px] rounded-full opacity-20"
        style={{ backgroundColor: secondarySolid }}
      />

      <main className="relative z-10 w-full max-w-6xl px-6 py-12 flex flex-col items-center">
        
        {/* Logo superior con bounce suave */}
        <div className="mb-12 transition-all duration-700 hover:scale-110">
          <img 
            src={school.logoUrl || "/images/logo-velez.png"} 
            alt={school.name} 
            className="h-24 md:h-28 object-contain drop-shadow-2xl"
          />
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-[1.1]">
            Campus Virtual <br />
            <span 
              className="bg-clip-text text-transparent bg-gradient-to-r"
              style={{ backgroundImage: `linear-gradient(to right, ${primarySolid}, ${secondarySolid})` }}
            >
              {school.name}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Accedé a tus materias, materiales y seguimiento académico en un solo lugar. 
            Potenciamos tu aprendizaje con la mejor tecnología.
          </p>

          {/* Botones de Acción */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <a 
              href="/campus/auth/login"
              className="group relative w-full sm:w-auto px-10 py-5 rounded-2xl text-white font-bold text-lg shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
              style={{ backgroundColor: primarySolid }}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative flex items-center justify-center gap-2">
                Iniciar Sesión <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </a>
            
            <a 
              href="/campus/auth/register"
              className="w-full sm:w-auto px-10 py-5 rounded-2xl font-bold text-lg border-2 bg-white/50 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:shadow-xl flex items-center justify-center"
              style={{ 
                borderColor: `${primarySolid}30`,
                color: primarySolid 
              }}
            >
              Registrarse
            </a>
          </div>
        </div>

        {/* Tarjetas informativas sutiles (Para que no quede vacío abajo) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
          {[
            { icon: <GraduationCap />, title: "Materias", desc: "Todo el material de tus materias organizado y accesible." },
            { icon: <FileText />, title: "Recursos Didácticos", desc: "Guías, videos y archivos compartidos por tus docentes." },
            { icon: <BarChart />, title: "Seguimiento", desc: "Consultá tu progreso académico y calificaciones." }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-3xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: primaryLight, color: primarySolid }}
              >
                {item.icon}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-500 leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>

      </main>

      {/* Footer minimal */}
      <footer className="mt-auto py-8 text-slate-400 text-sm font-medium tracking-wide">
        © {new Date().getFullYear()} {school.name}
      </footer>
    </div>
  );
}

