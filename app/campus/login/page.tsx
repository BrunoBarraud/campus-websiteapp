"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Modal from "../../../components/common/modal"; // Adjust the import path as necessary

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push("/campus/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <button
        onClick={() => setIsModalOpen(true)}
        className="mb-2 text-xl md:text-2xl text-rose-950 uppercase font-bold bg-yellow-400 px-2 py-0.5 rounded-lg shadow-sm transition hover:bg-yellow-500"
      >
        ¡Inicia Sesión!
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
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
            ¿No tenés cuenta? <Link href="/campus/register" className="text-yellow-400 hover:underline">Registrate</Link>
          </p>
        </form>
      </Modal>
    </div>
  );
};

export default LoginPage;
