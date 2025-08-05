"use client";
import { useState } from "react";

export default function SetupPage() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [adminInfo, setAdminInfo] = useState<any>(null);

  const checkAdmin = async () => {
    try {
      setStatus("loading");
      const response = await fetch("/api/setup-admin");
      const data = await response.json();

      if (data.hasAdmin) {
        setMessage("Ya existe un usuario administrador");
        setAdminInfo(data.admin);
      } else {
        setMessage("No hay usuario administrador configurado");
        setAdminInfo(null);
      }
      setStatus("success");
    } catch {
      setMessage("Error al verificar administrador");
      setStatus("error");
    }
  };

  const createAdmin = async () => {
    try {
      setStatus("loading");
      const response = await fetch("/api/setup-admin", {
        method: "POST",
      });
      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setAdminInfo(data.user);
        setStatus("success");
      } else {
        setMessage(data.error || "Error al crear administrador");
        setStatus("error");
      }
    } catch (err) {
      console.error("Error creating admin:", err);
      setMessage("Error al crear administrador");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Setup del Sistema
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Configuración inicial del Campus Virtual
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <button
              onClick={checkAdmin}
              disabled={status === "loading"}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {status === "loading" ? "Verificando..." : "Verificar Admin"}
            </button>

            <button
              onClick={createAdmin}
              disabled={status === "loading"}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {status === "loading" ? "Creando..." : "Crear Admin"}
            </button>
          </div>

          {message && (
            <div
              className={`p-4 rounded-md ${
                status === "error"
                  ? "bg-red-50 text-red-700"
                  : status === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {message}
            </div>
          )}

          {adminInfo && (
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Información del Administrador:
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p>
                  <strong>Email:</strong> {adminInfo.email}
                </p>
                <p>
                  <strong>Nombre:</strong> {adminInfo.name}
                </p>
                <p>
                  <strong>Rol:</strong> {adminInfo.role}
                </p>
                <p>
                  <strong>ID:</strong> {adminInfo.id}
                </p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">
              Credenciales por defecto:
            </h3>
            <div className="text-sm text-yellow-700">
              <p>
                <strong>Email:</strong> admin@ipdvs.edu.ar
              </p>
              <p>
                <strong>Contraseña:</strong> admin123
              </p>
            </div>
          </div>

          <div className="text-center">
            <a
              href="/campus/auth/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Ir al Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
