"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string }) => Promise<void>;
  forumTitle: string;
}

export default function AskQuestionModal({
  isOpen,
  onClose,
  onSubmit,
  forumTitle,
}: AskQuestionModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.title.length < 5) {
      setError("El título debe tener al menos 5 caracteres");
      return;
    }

    if (formData.content.length < 10) {
      setError("La pregunta debe tener al menos 10 caracteres");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({ title: "", content: "" });
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al crear la pregunta");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Hacer una Pregunta</h2>
            <p className="text-sm text-gray-600 mt-1">
              Foro: {forumTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título de tu pregunta *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: ¿Cómo se resuelve el ejercicio 5?"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 5 caracteres
            </p>
          </div>

          {/* Contenido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe tu pregunta *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Explica con detalle tu duda..."
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Mínimo 10 caracteres. Sé claro y específico para obtener mejores respuestas.
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Consejos para hacer una buena pregunta:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Sé específico sobre lo que no entiendes</li>
              <li>• Menciona qué has intentado hasta ahora</li>
              <li>• Si es sobre un ejercicio, indica el número</li>
              <li>• Revisa si tu pregunta ya fue respondida antes</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-yellow-500 to-rose-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Publicando..." : "Publicar Pregunta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
