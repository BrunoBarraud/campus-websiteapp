"use client";
import React, { useState } from "react";
import DashboardLayout from "../../../components/dashboard/DashboardLayout";

const ProfilePage = () => {
  // Estado local para simular datos de usuario
  const [name, setName] = useState("Usuario Ejemplo");
  const [email, setEmail] = useState("usuario@ejemplo.com");
  const role = "Estudiante"; // rol solo lectura

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Perfil actualizado:\nNombre: ${name}\nEmail: ${email}`);
    // Aquí se podría integrar backend luego
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Editar Perfil</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-md shadow-md max-w-lg space-y-6"
      >
        <div>
          <label className="block font-semibold mb-1" htmlFor="name">
            Nombre completo
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1" htmlFor="email">
            Correo electrónico
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Rol</label>
          <input
            type="text"
            value={role}
            readOnly
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Guardar cambios
        </button>
      </form>
    </DashboardLayout>
  );
};

export default ProfilePage;
