"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          "Credenciales inválidas. Por favor verifica tu email y contraseña."
        );
      } else {
        // Redirigir a dashboard por defecto, el middleware se encargará de redirigir según el rol
        router.push("/campus/dashboard");
        router.refresh();
      }
    } catch (error) {
      setError("Error de conexión. Por favor intenta nuevamente.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl border border-rose-100">
        {/* Logo y título */}
        <div className="text-center">
          <div className="mb-6">
            <Image
              src="/images/ipdvs-logo.png"
              alt="IPDVS Logo"
              width={120}
              height={120}
              className="mx-auto rounded-full shadow-lg border-4 border-rose-100"
              priority
            />
          </div>
          <h2 className="text-3xl font-bold text-rose-950 mb-2">
            Campus Virtual
          </h2>
          <p className="text-rose-700 font-medium">
            Instituto Pedro de Vega Sarmiento
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                placeholder="tu.email@ipdvs.edu.ar"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-rose-950 to-rose-800 text-white py-3 rounded-lg hover:from-rose-900 hover:to-rose-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Iniciando sesión...
              </div>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>

        {/* Información adicional */}
        <div className="text-center text-sm text-gray-600">
          <p>¿Problemas para acceder?</p>
          <p className="font-medium text-rose-700">
            Contacta al administrador del sistema
          </p>
        </div>

        {/* Usuarios de prueba para desarrollo */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Usuarios de prueba:
            </h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>
                <strong>Admin:</strong> admin@ipdvs.edu.ar
              </p>
              <p>
                <strong>Estudiante:</strong> brunobarraud15@gmail.com
              </p>
              <p>
                <strong>Profesor:</strong> maria.garnerorosso@ipdvs.edu.ar
              </p>
              <p className="text-gray-500 mt-2">
                Contraseña por defecto: (consulta base de datos)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
