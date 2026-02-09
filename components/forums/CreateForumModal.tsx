"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface CreateForumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    unit_id?: string;
    allow_student_answers: boolean;
    require_approval: boolean;
  }) => Promise<void>;
  units?: Array<{ id: string; title: string }>;
  subjectName: string;
}

export default function CreateForumModal({
  isOpen,
  onClose,
  onSubmit,
  units = [],
  subjectName,
}: CreateForumModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    unit_id: "",
    allow_student_answers: true,
    require_approval: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.title.length < 3) {
      setError("El título debe tener al menos 3 caracteres");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        unit_id: formData.unit_id || undefined,
      });
      setFormData({
        title: "",
        description: "",
        unit_id: "",
        allow_student_answers: true,
        require_approval: false,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al crear el foro");
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
            <h2 className="text-2xl font-bold text-gray-900">Crear Nuevo Foro</h2>
            <p className="text-sm text-gray-600 mt-1">
              Materia: {subjectName}
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
              Título del Foro *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Dudas sobre la Unidad 1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el propósito de este foro..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
            />
          </div>

          {/* Unidad (opcional) */}
          {units.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad (opcional)
              </label>
              <select
                value={formData.unit_id}
                onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              >
                <option value="">Foro general de la materia</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Opciones */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">Configuración</h3>
            
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allow_student_answers}
                onChange={(e) =>
                  setFormData({ ...formData, allow_student_answers: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
              />
              <div>
                <div className="font-medium text-gray-900">
                  Permitir respuestas entre estudiantes
                </div>
                <div className="text-sm text-gray-600">
                  Los estudiantes pueden responder preguntas de sus compañeros
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.require_approval}
                onChange={(e) =>
                  setFormData({ ...formData, require_approval: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-400"
              />
              <div>
                <div className="font-medium text-gray-900">
                  Requerir aprobación de preguntas
                </div>
                <div className="text-sm text-gray-600">
                  Las preguntas deben ser aprobadas antes de ser visibles
                </div>
              </div>
            </label>
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
              {loading ? "Creando..." : "Crear Foro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
