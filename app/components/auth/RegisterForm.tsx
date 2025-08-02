"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ACADEMIC_CONFIG } from "@/constant/constant";

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: 'student' | 'teacher';
  year?: number;
  division?: string;
}

export default function RegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/campus/auth/login?message=Registro exitoso. Por favor, inicia sesión.");
      } else {
        setError(data.error || "Error al registrar usuario");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Error de conexión. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' ? parseInt(value) : value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-rose-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <Image
              src="/images/ipdvs-logo.png"
              alt={ACADEMIC_CONFIG.INSTITUTION.fullName}
              width={120}
              height={120}
              className="mx-auto rounded-full shadow-lg border-4 border-rose-100"
              priority
            />
          </div>
          <h2 className="text-3xl font-bold text-rose-950 mb-2">
            Registro de Usuario
          </h2>
          <p className="text-rose-700 font-medium">
            {ACADEMIC_CONFIG.INSTITUTION.fullName}
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre completo
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                placeholder="Tu nombre completo"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                placeholder="tu.email@ipdvs.edu.ar"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de usuario
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                disabled={isLoading}
              >
                <option value="student">Estudiante</option>
                <option value="teacher">Profesor</option>
              </select>
            </div>

            {formData.role === 'student' && (
              <>
                <div>
                  <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                    Año
                  </label>
                  <select
                    id="year"
                    name="year"
                    value={formData.year || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Selecciona un año</option>
                    <option value="1">1° Año</option>
                    <option value="2">2° Año</option>
                    <option value="3">3° Año</option>
                    <option value="4">4° Año</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-1">
                    División
                  </label>
                  <select
                    id="division"
                    name="division"
                    value={formData.division || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Selecciona una división</option>
                    <option value="A">División A</option>
                    <option value="B">División B</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                disabled={isLoading}
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all duration-200"
                placeholder="••••••••"
                disabled={isLoading}
                minLength={6}
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
                Registrando...
              </div>
            ) : (
              "Registrarse"
            )}
          </button>
        </form>

        {/* Enlaces */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{" "}
            <a
              href="/campus/auth/login"
              className="font-medium text-rose-700 hover:text-rose-600 transition-colors"
            >
              Iniciar sesión
            </a>
          </p>
        </div>

        {/* Información adicional */}
        <div className="text-center text-sm text-gray-600 mt-4">
          <p>¿Problemas para registrarte?</p>
          <p className="font-medium text-rose-700">
            Contacta al administrador del sistema
          </p>
        </div>
      </div>
    </div>
  );
}
