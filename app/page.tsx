"use client";
import React from "react";
import { useSchool } from "@/app/lib/contexts/SchoolContext";

export default function Page() {
  const school = useSchool();
  
  // Mostrar siempre la página de bienvenida con los colores del tema actual
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        background: `linear-gradient(to bottom right, var(--primary-surface), white, rgba(var(--primary-rgb), 0.05))`
      }}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bienvenido al{" "}
          <span 
            className="font-bold"
            style={{ color: "var(--primary)" }}
          >
            Campus
          </span>{" "}
          <span 
            className="font-bold"
            style={{ color: "var(--primary-light)" }}
          >
            Virtual
          </span>
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Tu plataforma educativa digital
        </p>
        <div className="space-x-4">
          <a 
            href="/campus/auth/login"
            className="text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all"
            style={{
              background: `linear-gradient(to right, var(--primary), var(--primary-light))`
            }}
          >
            Iniciar Sesión
          </a>
          <a 
            href="/campus/auth/register"
            className="px-6 py-3 rounded-lg hover:shadow-lg transition-all"
            style={{
              border: `2px solid var(--primary)`,
              color: "var(--primary)",
              backgroundColor: "transparent"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary-surface)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Registrarse
          </a>
        </div>
      </div>
    </div>
  );
}
