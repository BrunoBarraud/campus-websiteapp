"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

const LoadingNav = () => (
  <nav className="fixed top-0 left-0 w-full h-12 bg-white/80 backdrop-blur-sm border-b border-gray-200 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
      <div className="flex items-center">
        <Image
          src="/images/ipdvs-logo.png"
          alt="IPDVS Logo"
          width={40}
          height={40}
          className="h-8 w-auto"
        />
        <span className="ml-2 text-lg font-bold text-gray-900">
          Campus Virtual
        </span>
      </div>
    </div>
  </nav>
);

const Nav = () => {
  const [mounted, setMounted] = useState(false);

  // Mount effect - SIEMPRE se ejecuta
  useEffect(() => {
    setMounted(true);
  }, []);

  // Si no está montado, mostrar loading nav
  if (!mounted) {
    return <LoadingNav />;
  }

  return (
    <nav className="sticky top-0 bg-rose-950 transition-all duration-200 h-14 sm:h-16 md:h-20 z-[60] shadow-lg">
      <div className="flex items-center h-full justify-between w-[95%] sm:w-[90%] xl:w-[80%] mx-auto px-2 sm:px-0">
        {/* Logo and Title */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Link href="/campus/dashboard" className="flex items-center group">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex justify-center items-center">
              <Image
                src="/images/ipdvs-logo.png"
                alt="Logo Campus Virtual Velez"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain transition-all duration-300 group-hover:scale-110 cursor-pointer filter drop-shadow-sm group-hover:drop-shadow-lg"
              />
            </div>
          </Link>

          {/* Estilo especial para "Campus Virtual" con colores específicos */}
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            <span className="text-sm sm:text-lg md:text-xl lg:text-2xl text-rose-950 uppercase font-bold bg-amber-400 px-1 sm:px-2 py-0.5 rounded-lg shadow-lg">
              Campus
            </span>
            <span className="text-sm sm:text-lg md:text-xl lg:text-2xl text-amber-400 uppercase font-bold bg-rose-950 px-1 sm:px-2 py-0.5 rounded-lg shadow-lg">
              Virtual
            </span>
          </div>
        </div>
              </div>
    </nav>
  );
};

export default Nav;
