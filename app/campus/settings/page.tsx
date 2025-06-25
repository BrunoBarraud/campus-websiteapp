"use client";
import React, { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const SettingsPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Preferencias guardadas:\nModo oscuro: ${darkMode ? "Sí" : "No"}\nNotificaciones: ${
      notifications ? "Sí" : "No"
    }`);
    // Aquí luego podés integrar guardado en backend o localStorage
  };

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-md shadow-md max-w-lg space-y-6"
      >
        <div className="flex items-center justify-between">
          <label htmlFor="darkMode" className="font-semibold">
            Modo oscuro
          </label>
          <input
            type="checkbox"
            id="darkMode"
            checked={darkMode}
            onChange={() => setDarkMode(!darkMode)}
            className="h-5 w-5 cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between">
          <label htmlFor="notifications" className="font-semibold">
            Notificaciones
          </label>
          <input
            type="checkbox"
            id="notifications"
            checked={notifications}
            onChange={() => setNotifications(!notifications)}
            className="h-5 w-5 cursor-pointer"
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition"
        >
          Guardar preferencias
        </button>
      </form>
    </DashboardLayout>
  );
};

export default SettingsPage;
