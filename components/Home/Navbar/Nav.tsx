"use client";
import Link from "next/link";
import Image from "next/image";
import { ACADEMIC_CONFIG } from "@/constant/academic";

const Nav = () => {
  return (
    <nav className="sticky top-0 bg-rose-950 border-b border-rose-800 h-20 z-50 shadow-lg">
      <div className="flex items-center h-full justify-between max-w-full mx-auto px-6">
        {/* Logo and Title */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center group space-x-3">
            <div className="w-12 h-12 flex justify-center items-center relative group-hover:scale-110 transition-transform duration-300 ease-in-out">
              <Image
                src={ACADEMIC_CONFIG.INSTITUTION.logo}
                alt={`Logo Campus Virtual ${ACADEMIC_CONFIG.INSTITUTION.name}`}
                width={48}
                height={48}
                className="w-12 h-12 object-contain transition-all duration-300 group-hover:rotate-12 relative z-10"
              />
            </div>
            <div className="flex items-center space-x-1">
              <span className="px-3 py-1 bg-amber-400 text-rose-950 text-xl font-bold rounded-md shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                Campus
              </span>
              <span className="px-3 py-1 bg-rose-950 text-amber-400 text-xl font-bold rounded-md shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                Virtual
              </span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Nav;
