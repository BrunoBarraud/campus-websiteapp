import React from "react";
import { ACADEMIC_CONFIG } from "@/constant/academic";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-auto border-t border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium">
              Copyright © {new Date().getFullYear()} Desarrollo Web{" "}
              {ACADEMIC_CONFIG.INSTITUTION.name}
            </p>
            <p className="text-sm text-gray-300">
              Todos los derechos reservados.
            </p>
          </div>
          <div className="text-center border-t border-gray-700 pt-4 w-full max-w-md">
            <p className="text-xs text-gray-400">
              Desarrollado por{" "}
              <span className="font-semibold text-gray-300">
                Bruno Ariel Barraud
              </span>
            </p>
            <p className="text-xs text-gray-400">
              Fullstack Developer | Ingeniero en Sistemas de Información
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
