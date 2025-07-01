"use client";
import React, { useState } from "react";
import Link from "next/link";
import Modal from "../../../components/common/modal"; // Ajusta la ruta de importación según sea necesario

const AuthPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Estado para controlar qué formulario mostrar

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = e.currentTarget.email.value;
    const password = e.currentTarget.password.value;

    if(!email || !password) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    console.log("Iniciar sesión");
  };

  const handleRegisterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Aquí puedes manejar la lógica de registro
    console.log("Registrarse");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <button
        onClick={() => {
          setIsLogin(true);
          setIsModalOpen(true);
        }}
        className="mb-2 text-xl md:text-2xl text-rose-950 uppercase font-bold bg-yellow-400 px-2 py-0.5 rounded-lg shadow-sm transition hover:bg-yellow-500"
      >
        ¡Inicia Sesión!
      </button>

      <button
        onClick={() => {
          setIsLogin(false);
          setIsModalOpen(true);
        }}
        className="mb-2 text-xl md:text-2xl text-rose-950 uppercase font-bold bg-yellow-400 px-2 py-0.5 rounded-lg shadow-sm transition hover:bg-yellow-500"
      >
        ¡Regístrate!
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="bg-rose-950 p-6 rounded-lg shadow-md w-full space-y-4 border border-amber-300">
            <input
              type="email"
              placeholder="Correo electrónico"
              className="w-full px-4 py-2 border border-yellow-400 rounded-md bg-white text-black placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full px-4 py-2 border border-yellow-400 rounded-md bg-white text-black placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              className="w-full bg-yellow-400 text-rose-950 py-2 rounded-md hover:bg-yellow-500 transition"
            >
              Iniciar Sesión
            </button>
            <p className="text-sm text-center text-white">
              ¿No tenés cuenta? <Link href="#" onClick={() => { setIsLogin(false); }} className="text-yellow-400 hover:underline">Registrate</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="bg-rose-950 p-6 rounded-lg shadow-md w-full space-y-4">
            <input
              type="text"
              placeholder="Nombre completo"
              className="w-full px-4 py-2 border border-yellow-400 rounded-md bg-white text-black placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              type="email"
              placeholder="Correo electrónico"
              className="w-full px-4 py-2 border border-yellow-400 rounded-md bg-white text-black placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full px-4 py-2 border border-yellow-400 rounded-md bg-white text-black placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              className="w-full bg-yellow-400 text-rose-950 py-2 rounded-md hover:bg-yellow-500 transition"
            >
              Registrarse
            </button>
            <p className="text-sm text-center text-white">
              ¿Ya tenés cuenta? <Link href="#" onClick={() => { setIsLogin(true); }} className="text-yellow-400 hover:underline">Iniciá sesión</Link>
            </p>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AuthPage;
