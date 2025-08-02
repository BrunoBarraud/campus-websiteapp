"use client";
import Link from "next/link";
import Image from "next/image";
import { ACADEMIC_CONFIG } from '@/constant/academic';
import NotificationDropdown from '@/components/dashboard/NotificationDropdown';

const Nav = () => {

  return (
    <nav className="sticky top-0 bg-rose-950 transition-all duration-200 h-[12vh] z-[60] shadow-lg hover:shadow-xl">
      <div className="flex items-center h-full justify-between w-[95%] sm:w-[90%] xl:w-[80%] mx-auto px-2 sm:px-0">
        {/* Logo and Title */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Link href="/campus/dashboard" className="flex items-center group">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex justify-center items-center">
              <Image
                src={ACADEMIC_CONFIG.INSTITUTION.logo}
                alt={`Logo Campus Virtual ${ACADEMIC_CONFIG.INSTITUTION.name}`}
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 cursor-pointer filter drop-shadow-sm group-hover:drop-shadow-xl"
              />
            </div>
          </Link>

          {/* Estilo especial para "Campus Virtual" con colores específicos y animaciones */}
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            <span
              className="text-sm sm:text-lg md:text-xl lg:text-2xl text-rose-950 uppercase font-bold bg-amber-400 px-1 sm:px-2 py-0.5 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-amber-300 cursor-default"
            >
              Campus
            </span>
            <span
              className="text-sm sm:text-lg md:text-xl lg:text-2xl text-amber-400 uppercase font-bold bg-rose-950 px-1 sm:px-2 py-0.5 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:bg-rose-900 cursor-default"
            >
              Virtual
            </span>
          </div>
        </div>

        {/* Notification Bell */}
        <div className="flex items-center">
          <div className="transform transition-all duration-300 hover:scale-110">
            <NotificationDropdown theme="dark" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

