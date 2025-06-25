import React from "react";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-10">
      <div className="container mx-auto text-center">
        <p className="text-sm">
         Copyright © {new Date().getFullYear()} Desarrollo Web IPDVS. Todos los derechos reservados.
        </p>
        <p className="text-xs mt-2">
          Bruno Ariel Barraud, Fullstack Developer. Ingeniero en Sistemas de Información
        </p>
      </div>
    </footer>
  );
};

export default Footer;