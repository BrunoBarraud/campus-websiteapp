"use client";
import { useState } from "react";
import navLinks from "../../../constant/constant";
import Link from "next/link";
import { TbUserCircle, TbMenu2, TbX } from "react-icons/tb";
import Image from "next/image";

const Nav = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 bg-rose-950 transition-all duration-200 h-[12vh] z-[60] shadow-md">
      <div className="flex items-center h-full justify-between w-[90%] xl:w-[80%] mx-auto">
        {/* Logo and Title */}
        <div className="flex items-center space-x-2">
          <Link href="/campus/dashboard" className="flex items-center">
            <div className="w-20 h-20 flex justify-center items-center">
              <Image
                src="/images/ipdvs-logo.png"
                alt="Logo Campus Virtual Velez"
                width={50}
                height={50}
                className="object-contain transition duration-300 hover:scale-110 cursor-pointer"
              />
            </div>
          </Link>

          {/* Estilo especial para "Campus Virtual" */}
          <div className="flex items-center space-x-1">
            <span
              className="text-xl md:text-2xl text-rose-950 uppercase font-bold bg-yellow-400 px-2 py-0.5 rounded-lg shadow-sm transition"
            >
              Campus
            </span>
            <span
              className="text-xl md:text-2xl text-yellow-400 uppercase font-bold bg-rose-950 px-2 py-0.5 rounded-lg shadow-sm transition"
            >
              Virtual
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-10">
          {navLinks.map((link) => (
            <Link href={link.url} key={link.id}>
              <p
                className="relative text-white text-base font-medium w-fit block
                  after:block after:content-[''] after:absolute after:h-[3px] after:bg-amber-400
                  after:w-full after:scale-x-0 hover:after:scale-x-100 after:transition after:duration-300 after:origin-right"
              >
                {link.label}
              </p>
            </Link>
          ))}
        </div>

        {/* Profile Dropdown + Mobile Menu Button */}
        <div className="flex items-center space-x-4">
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center text-white focus:outline-none"
              aria-label="Perfil de usuario"
            >
              <TbUserCircle className="w-8 h-8 transition-transform hover:scale-110" />
            </button>

            {/* Dropdown menu with animation */}
            {dropdownOpen && (
              <div
                id="user-dropdown"
                className="absolute right-0 mt-2 w-52 bg-white divide-y divide-gray-200 rounded-xl shadow-lg dark:bg-gray-800 dark:divide-gray-700 z-50 transform opacity-100 scale-100 transition-all duration-200 origin-top-right"
              >
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">Nombre Usuario</span>
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">correo@campus.edu</span>
                </div>
                <ul className="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="user-menu-button">
                  <li>
                    <Link
                      href="/campus/profile"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setDropdownOpen(false)}
                    >
                      👤 Perfil
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/campus/settings"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setDropdownOpen(false)}
                    >
                      ⚙️ Configuración
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/campus/logout"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                      onClick={() => setDropdownOpen(false)}
                    >
                      🔐 Cerrar Sesión
                    </Link>
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-white focus:outline-none"
            aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileMenuOpen ? (
              <TbX className="w-6 h-6" />
            ) : (
              <TbMenu2 className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden bg-rose-950 p-4 pb-6 shadow-md animate-fadeIn"
        >
          <ul className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <li key={link.id}>
                <Link
                  href={link.url}
                  onClick={() => setMobileMenuOpen(false)} // cierra el menú al hacer click
                  className="text-white text-base font-medium hover:text-amber-400 transition"
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {/* Mobile Profile Section */}
            <li className="pt-4 mt-4 border-t border-rose-800">
              <h3 className="text-sm text-gray-400 uppercase mb-2">Mi cuenta</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/campus/profile"
                    className="flex items-center gap-2 text-white hover:text-amber-400 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    👤 Perfil
                  </Link>
                </li>
                <li>
                  <Link
                    href="/campus/settings"
                    className="flex items-center gap-2 text-white hover:text-amber-400 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    ⚙️ Configuración
                  </Link>
                </li>
                <li>
                  <Link
                    href="/campus/logout"
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🔐 Cerrar Sesión
                  </Link>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Nav;

