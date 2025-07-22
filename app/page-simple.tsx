import React from "react";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-rose-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bienvenido al <span className="text-yellow-500">Campus</span> <span className="text-rose-500">Virtual</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Tu plataforma educativa digital
        </p>
        <div className="space-x-4">
          <a 
            href="/campus/auth/login"
            className="bg-gradient-to-r from-yellow-500 to-rose-500 text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
          >
            Iniciar Sesión
          </a>
          <a 
            href="/campus/auth/register"
            className="border-2 border-yellow-400 text-yellow-600 px-6 py-3 rounded-lg hover:bg-yellow-50 transition-all"
          >
            Registrarse
          </a>
        </div>
      </div>
    </div>
  );
}
