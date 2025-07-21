"use client";
import Link from "next/link";
import Image from "next/image";

const Nav = () => {

  return (
    <nav className="sticky top-0 bg-rose-950 transition-all duration-200 h-[12vh] z-[60] shadow-md">
      <div className="flex items-center h-full justify-between w-[95%] sm:w-[90%] xl:w-[80%] mx-auto px-2 sm:px-0">
        {/* Logo and Title */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          <Link href="/campus/dashboard" className="flex items-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 flex justify-center items-center">
              <Image
                src="/images/ipdvs-logo.png"
                alt="Logo Campus Virtual Velez"
                width={40}
                height={40}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain transition duration-300 hover:scale-110 cursor-pointer"
              />
            </div>
          </Link>

          {/* Estilo especial para "Campus Virtual" */}
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            <span
              className="text-sm sm:text-lg md:text-xl lg:text-2xl text-rose-950 uppercase font-bold bg-yellow-400 px-1 sm:px-2 py-0.5 rounded-lg shadow-sm transition"
            >
              Campus
            </span>
            <span
              className="text-sm sm:text-lg md:text-xl lg:text-2xl text-yellow-400 uppercase font-bold bg-rose-950 px-1 sm:px-2 py-0.5 rounded-lg shadow-sm transition"
            >
              Virtual
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Nav;

